const assert = require('assert');
const events = require('events');
const net = require('net');
const snmp = require('..');

describe('Subagent TCP framing', function() {
    let subagent;
    let originalSocket;

    beforeEach(function() {
        originalSocket = net.Socket;
        class TestSocket extends events.EventEmitter {
            connect() {}
            write() {}
            end() {}
        }
        net.Socket = TestSocket;
        try {
            subagent = snmp.createSubagent({});
        } finally {
            net.Socket = originalSocket;
        }
    });

    function responses(count, callback) {
        const packets = [];
        for (let i = 0; i < count; i++) {
            subagent.ping(callback);
        }
        for (const packetID of Object.keys(subagent.requestPdus)) {
            packets.push(snmp.AgentXPdu.createFromVariables({
                pduType: snmp.AgentXPduType.Response,
                packetID: Number(packetID),
                sessionID: 7,
                sysUpTime: 123,
                error: 0,
                index: 0
            }).toBuffer());
        }
        return packets;
    }

    it('dispatches a complete response', function() {
        let called = 0;
        const packets = responses(1, function(error, pdu) {
            assert.ifError(error);
            assert.strictEqual(pdu.sysUpTime, 123);
            called++;
        });
        subagent.socket.emit('data', packets[0]);
        assert.strictEqual(called, 1);
        assert.deepStrictEqual(Object.keys(subagent.requestPdus), []);
    });

    it('dispatches all responses in one TCP chunk', function() {
        let called = 0;
        const packets = responses(3, function(error) {
            assert.ifError(error);
            called++;
        });
        subagent.socket.emit('data', Buffer.concat(packets));
        assert.strictEqual(called, 3);
        assert.deepStrictEqual(Object.keys(subagent.requestPdus), []);
    });

    for (const boundary of [1, 7, 19, 20, 24, 27]) {
        it('waits for a response split at byte ' + boundary, function() {
            let called = 0;
            const packet = responses(1, function(error) {
                assert.ifError(error);
                called++;
            })[0];
            assert.doesNotThrow(function() {
                subagent.socket.emit('data', packet.subarray(0, boundary));
            });
            assert.strictEqual(called, 0);
            subagent.socket.emit('data', packet.subarray(boundary));
            assert.strictEqual(called, 1);
        });
    }

    it('keeps a partial response after dispatching its predecessor', function() {
        let called = 0;
        const packets = responses(3, function(error) {
            assert.ifError(error);
            called++;
        });
        subagent.socket.emit('data', Buffer.concat([packets[0], packets[1].subarray(0, 9)]));
        assert.strictEqual(called, 1);
        subagent.socket.emit('data', Buffer.concat([packets[1].subarray(9), packets[2]]));
        assert.strictEqual(called, 3);
    });

    it('discards an incomplete frame when the connection closes', function() {
        let called = 0;
        const packets = responses(1, function(error) {
            assert.ifError(error);
            called++;
        });
        subagent.socket.emit('data', packets[0].subarray(0, 7));
        subagent.socket.emit('close');
        subagent.socket.emit('data', packets[0]);
        assert.strictEqual(called, 1);
    });

    it('preserves rejection of a complete unknown PDU', function() {
        const packet = responses(1, function() {})[0];
        packet[1] = 255;
        assert.throws(function() {
            subagent.socket.emit('data', packet);
        }, /Unknown PDU type '255'/);
    });
});

describe('Subagent loopback master', function() {
    it('receives all 1,200 provider registration responses', async function() {
        this.timeout(5000);
        let subagent;
        let peer;
        let timer;
        const server = net.createServer(function(socket) {
            peer = socket;
            let pending = Buffer.alloc(0);
            const replies = [];
            socket.on('data', function(chunk) {
                pending = Buffer.concat([pending, chunk]);
                while (pending.length >= 20 && pending.length >= 20 + pending.readUInt32BE(16)) {
                    const size = 20 + pending.readUInt32BE(16);
                    replies.push(snmp.AgentXPdu.createFromVariables({
                        pduType: snmp.AgentXPduType.Response,
                        packetID: pending.readUInt32BE(12),
                        sessionID: 7,
                        sysUpTime: 123,
                        error: 0,
                        index: 0
                    }).toBuffer());
                    pending = pending.subarray(size);
                }
                if (replies.length === 1200) {
                    socket.write(Buffer.concat(replies));
                }
            });
        });
        await new Promise(function(resolve) { server.listen(0, '127.0.0.1', resolve); });
        try {
            subagent = snmp.createSubagent({ master: '127.0.0.1', masterPort: server.address().port });
            await new Promise(function(resolve, reject) {
                subagent.socket.once('connect', resolve);
                subagent.once('error', reject);
            });
            const providers = Array.from({ length: 1200 }, function(_, i) {
                return {
                    name: 'streamScalar' + i,
                    type: snmp.MibProviderType.Scalar,
                    oid: '1.3.6.1.4.1.8072.9999.' + (i + 1),
                    scalarType: snmp.ObjectType.Integer,
                    maxAccess: snmp.MaxAccess['read-only']
                };
            });
            let received = 0;
            await new Promise(function(resolve, reject) {
                timer = setTimeout(function() {
                    reject(new Error('Only ' + received + ' of 1200 registration callbacks completed'));
                }, 2000);
                subagent.registerProviders(providers, function(error) {
                    if (error) { reject(error); return; }
                    if (++received === providers.length) { resolve(); }
                });
            });
            assert.strictEqual(received, providers.length);
            assert.deepStrictEqual(Object.keys(subagent.requestPdus), []);
        } finally {
            clearTimeout(timer);
            if (subagent) { subagent.socket.destroy(); }
            if (peer) { peer.destroy(); }
            await new Promise(function(resolve) { server.close(resolve); });
        }
    });
});
