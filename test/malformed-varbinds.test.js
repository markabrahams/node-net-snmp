const assert = require('assert');
const snmp = require('../');

// A truncated varbind list must be rejected as a parse error rather than
// sending readVarbinds() into an infinite loop (GitHub issue #312).
describe('Malformed varbind lists', function () {

	const testRinfo = {
		address: '192.168.1.100',
		family: 'IPv4',
		port: 50123,
		size: 0
	};

	// A v2c GetRequest whose single varbind ends with a lone OID tag (0x06) and
	// no length byte. readOID() returns null without advancing, so the old loop
	// spun forever pushing varbinds.
	const truncatedOidPacket = Buffer.from (
		'301c02010104067075626c6963a00f0201010201000201003005300306', 'hex');

	// A v2c GetResponse with a valid OID "1.3" followed by a value whose tag is a
	// lone OID byte (0x06) with no length. The value read of the OID returns null.
	const truncatedOidValuePacket = Buffer.from (
		'301e02010104067075626c6963a21102010102010002010030063004 06012b06'.replace (/ /g, ''), 'hex');

	function createMockDgram (captured) {
		return {
			createSocket: function () {
				const socket = {
					handlers: {},
					on: function (event, handler) {
						this.handlers[event] = handler;
					},
					bind: function () {},
					close: function () {},
					ref: function () {},
					unref: function () {},
					address: function () {
						return { address: '127.0.0.1', family: 'IPv4', port: 1620 };
					},
					send: function (buffer, offset, length, port, address, callback) {
						captured.sentBuffers.push (Buffer.from (buffer.slice (offset, offset + length)));
						if ( callback ) {
							callback (null, length);
						}
					}
				};
				captured.sockets.push (socket);
				return socket;
			}
		};
	}

	function createTestReceiver (options, callback) {
		const captured = { sockets: [], sentBuffers: [] };
		options.dgramModule = createMockDgram (captured);
		options.port = 1620;
		const receiver = snmp.createReceiver (options, callback);
		const deliverPacket = function (buffer, rinfo) {
			captured.sockets[0].handlers.message (buffer, rinfo);
		};
		return { receiver, deliverPacket, captured };
	}

	function createTestAgent (options, callback) {
		const captured = { sockets: [], sentBuffers: [] };
		options.dgramModule = createMockDgram (captured);
		options.port = 1620;
		const agent = snmp.createAgent (options, callback);
		const deliverPacket = function (buffer, rinfo) {
			captured.sockets[0].handlers.message (buffer, rinfo);
		};
		return { agent, deliverPacket, captured };
	}

	it('rejects a receiver packet with a truncated OID instead of looping', function (done) {
		const { receiver, deliverPacket } = createTestReceiver ({}, function (error) {
			assert.strictEqual (error.name, 'ProcessingError');
			assert (error.error instanceof snmp.ResponseInvalidError);
			assert.strictEqual (error.error.code, snmp.ResponseInvalidCode.EBadVarbindList);
			assert.strictEqual (error.rinfo, testRinfo);
			receiver.close ();
			done ();
		});
		deliverPacket (truncatedOidPacket, testRinfo);
	});

	it('rejects an agent packet with a truncated OID instead of looping', function (done) {
		const { agent, deliverPacket, captured } = createTestAgent ({}, function (error) {
			assert.strictEqual (error.name, 'ProcessingError');
			assert (error.error instanceof snmp.ResponseInvalidError);
			assert.strictEqual (error.error.code, snmp.ResponseInvalidCode.EBadVarbindList);
			assert.strictEqual (captured.sentBuffers.length, 0);
			agent.close ();
			done ();
		});
		deliverPacket (truncatedOidPacket, testRinfo);
	});

	it('rejects a truncated OID in the value position instead of looping', function (done) {
		const { receiver, deliverPacket } = createTestReceiver ({}, function (error) {
			assert.strictEqual (error.name, 'ProcessingError');
			assert (error.error instanceof snmp.ResponseInvalidError);
			assert.strictEqual (error.error.code, snmp.ResponseInvalidCode.EBadVarbindList);
			receiver.close ();
			done ();
		});
		deliverPacket (truncatedOidValuePacket, testRinfo);
	});

	it('still delivers a well-formed notification with its varbinds intact', function (done) {
		const captured = { sockets: [], sentBuffers: [] };
		const session = snmp.createSession ('127.0.0.1', 'public', {
			version: snmp.Version2c,
			dgramModule: createMockDgram (captured)
		});
		session.trap (snmp.TrapType.LinkDown, function () {});
		session.close ();
		const trapBuffer = captured.sentBuffers[0];

		const { receiver, deliverPacket } = createTestReceiver ({}, function (error, notification) {
			assert.strictEqual (error, null);
			assert.strictEqual (notification.pdu.type, snmp.PduType.TrapV2);
			assert (notification.pdu.varbinds.length >= 2);
			assert.strictEqual (notification.pdu.varbinds[0].oid, '1.3.6.1.2.1.1.3.0');
			receiver.close ();
			done ();
		});
		receiver.getAuthorizer ().addCommunity ('public');
		deliverPacket (trapBuffer, testRinfo);
	});
});
