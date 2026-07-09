const assert = require('assert');
const snmp = require('../');

describe('Receiver error rinfo', function () {

	const testRinfo = {
		address: '192.168.1.100',
		family: 'IPv4',
		port: 50123,
		size: 0
	};

	const authUser = {
		name: 'testUser',
		level: snmp.SecurityLevel.authNoPriv,
		authProtocol: snmp.AuthProtocols.sha,
		authKey: 'testAuthPassword'
	};

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

	// Uses a session with a mock dgram module to capture the exact wire buffer
	// for a v2c trap without sending anything over the network
	function generateV2TrapBuffer (community) {
		const captured = { sockets: [], sentBuffers: [] };
		const session = snmp.createSession ('127.0.0.1', community, {
			version: snmp.Version2c,
			dgramModule: createMockDgram (captured)
		});
		session.trap (snmp.TrapType.LinkDown, function () {});
		session.close ();
		assert.strictEqual (captured.sentBuffers.length, 1);
		return captured.sentBuffers[0];
	}

	// Same as above for an authenticated v3 trap
	function generateV3TrapBuffer (user) {
		const captured = { sockets: [], sentBuffers: [] };
		const session = snmp.createV3Session ('127.0.0.1', user, {
			dgramModule: createMockDgram (captured)
		});
		session.trap (snmp.TrapType.LinkDown, function () {});
		session.close ();
		assert.strictEqual (captured.sentBuffers.length, 1);
		return captured.sentBuffers[0];
	}

	// Creates a receiver with a mock dgram module and returns a function that
	// simulates delivery of a packet to the receiver's listening socket
	function createTestReceiver (options, callback) {
		const captured = { sockets: [], sentBuffers: [] };
		options.dgramModule = createMockDgram (captured);
		options.port = 1620;
		const receiver = snmp.createReceiver (options, callback);
		const deliverPacket = function (buffer, rinfo) {
			captured.sockets[0].handlers.message (buffer, rinfo);
		};
		return { receiver, deliverPacket };
	}

	it('includes rinfo on community authorization failure errors', function (done) {
		const buffer = generateV2TrapBuffer ('unauthorizedCommunity');
		const { receiver, deliverPacket } = createTestReceiver ({}, function (error, notification) {
			assert (error instanceof snmp.RequestFailedError);
			assert.match (error.message, /Local community not found for message with community unauthorizedCommunity/);
			assert.strictEqual (error.rinfo, testRinfo);
			assert.strictEqual (notification, undefined);
			receiver.close ();
			done ();
		});
		deliverPacket (buffer, testRinfo);
	});

	it('includes rinfo on unknown user authorization failure errors', function (done) {
		const buffer = generateV3TrapBuffer (authUser);
		const { receiver, deliverPacket } = createTestReceiver ({}, function (error) {
			assert (error instanceof snmp.RequestFailedError);
			assert.match (error.message, /Local user not found for message with user testUser/);
			assert.strictEqual (error.rinfo, testRinfo);
			receiver.close ();
			done ();
		});
		deliverPacket (buffer, testRinfo);
	});

	it('includes rinfo on authentication-required failure errors when authorization is disabled', function (done) {
		const buffer = generateV3TrapBuffer (authUser);
		const { receiver, deliverPacket } = createTestReceiver ({ disableAuthorization: true }, function (error) {
			assert (error instanceof snmp.RequestFailedError);
			assert.match (error.message, /Local user not found and message requires authentication with user testUser/);
			assert.strictEqual (error.rinfo, testRinfo);
			receiver.close ();
			done ();
		});
		deliverPacket (buffer, testRinfo);
	});

	it('includes rinfo on authentication digest failure errors', function (done) {
		const buffer = generateV3TrapBuffer (authUser);
		const { receiver, deliverPacket } = createTestReceiver ({}, function (error) {
			assert (error instanceof snmp.ResponseInvalidError);
			assert.strictEqual (error.code, snmp.ResponseInvalidCode.EAuthFailure);
			assert.strictEqual (error.rinfo, testRinfo);
			receiver.close ();
			done ();
		});
		receiver.getAuthorizer ().addUser ({
			name: authUser.name,
			level: authUser.level,
			authProtocol: authUser.authProtocol,
			authKey: 'differentAuthPassword'
		});
		deliverPacket (buffer, testRinfo);
	});

	it('delivers authorized notifications unchanged', function (done) {
		const buffer = generateV2TrapBuffer ('authorizedCommunity');
		const { receiver, deliverPacket } = createTestReceiver ({}, function (error, notification) {
			assert.strictEqual (error, null);
			assert.strictEqual (notification.rinfo, testRinfo);
			assert.strictEqual (notification.pdu.type, snmp.PduType.TrapV2);
			receiver.close ();
			done ();
		});
		receiver.getAuthorizer ().addCommunity ('authorizedCommunity');
		deliverPacket (buffer, testRinfo);
	});
});
