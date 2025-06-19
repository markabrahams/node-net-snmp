const assert = require('assert');
const snmp = require('../');

describe('Custom dgram module support', function () {
	it('should use custom dgram module in Session', function (done) {
		let createSocketCalled = false;
		const mockDgram = {
			createSocket: function (transport) {
				createSocketCalled = true;
				assert.equal(transport, 'udp4');
				
				// Return a mock socket
				return {
					unref: function () {},
					on: function () {},
					bind: function () {},
					close: function () {}
				};
			}
		};

		const session = snmp.createSession('127.0.0.1', 'public', {
			dgramModule: mockDgram
		});

		assert(createSocketCalled, 'Custom dgram module createSocket should have been called');
		session.close();
		done();
	});

	it('should use custom dgram module in Receiver', function (done) {
		let createSocketCalled = false;
		const mockDgram = {
			createSocket: function (transport) {
				createSocketCalled = true;
				assert.equal(transport, 'udp4');
				
				// Return a mock socket
				return {
					on: function () {},
					bind: function () {},
					close: function () {},
					address: function () {
						return { address: '127.0.0.1', family: 'IPv4', port: 162 };
					}
				};
			}
		};

		const receiver = snmp.createReceiver({
			dgramModule: mockDgram,
			port: 1162
		}, function () {});

		assert(createSocketCalled, 'Custom dgram module createSocket should have been called');
		receiver.close();
		done();
	});

	it('should fallback to default dgram when no custom module provided', function (done) {
		// This should not throw an error
		const session = snmp.createSession('127.0.0.1', 'public', {
			// No dgramModule specified
		});

		// Session should be created successfully
		assert(session);
		session.close();
		done();
	});
});
