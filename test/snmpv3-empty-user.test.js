const assert = require('assert');
const snmp = require('../');

// End-to-end checks over loopback UDP that a zero-length SNMPv3 user name is
// only accepted for engine ID discovery (RFC 3414 section 2.4), and that proxied
// requests are subject to the requesting user's access level.

const OID = '1.3.6.1.4.1.99999.1.0';

const fred = {
	name: 'fred',
	level: snmp.SecurityLevel.authPriv,
	authProtocol: snmp.AuthProtocols.sha,
	authKey: 'fred-auth-key',
	privProtocol: snmp.PrivProtocols.aes,
	privKey: 'fred-priv-key'
};

const operator = {
	name: 'operator',
	level: snmp.SecurityLevel.authPriv,
	authProtocol: snmp.AuthProtocols.sha,
	authKey: 'operator-auth-key',
	privProtocol: snmp.PrivProtocols.aes,
	privKey: 'operator-priv-key'
};

const emptyUser = { name: '', level: snmp.SecurityLevel.noAuthNoPriv };

function createAgent (port, options, users, communities) {
	const errors = [];
	const agent = snmp.createAgent (Object.assign ({ port: port }, options), function (error) {
		if ( error ) {
			errors.push (error);
		}
	});
	agent.errors = errors;
	(users || []).forEach (user => agent.getAuthorizer ().addUser (user));
	(communities || []).forEach (community => agent.getAuthorizer ().addCommunity (community));
	agent.getMib ().registerProvider ({
		name: 'secret',
		type: snmp.MibProviderType.Scalar,
		oid: '1.3.6.1.4.1.99999.1',
		scalarType: snmp.ObjectType.OctetString,
		maxAccess: snmp.MaxAccess['read-write']
	});
	agent.getMib ().setScalarValue ('secret', 'ORIGINAL');
	return agent;
}

function createV3Session (port, user, options) {
	return snmp.createV3Session ('127.0.0.1', user,
			Object.assign ({ port: port, timeout: 1000, retries: 0 }, options));
}

function get (port, user, options) {
	return new Promise (resolve => {
		const session = createV3Session (port, user, options);
		session.get ([OID], (error, varbinds) => {
			session.close ();
			resolve ({ error: error, varbinds: varbinds });
		});
	});
}

function getNext (port, user, options) {
	return new Promise (resolve => {
		const session = createV3Session (port, user, options);
		session.getNext (['1.3.6.1.4.1.99999'], (error, varbinds) => {
			session.close ();
			resolve ({ error: error, varbinds: varbinds });
		});
	});
}

function set (port, user, value, options) {
	return new Promise (resolve => {
		const session = createV3Session (port, user, options);
		session.set ([{ oid: OID, type: snmp.ObjectType.OctetString, value: value }], (error, varbinds) => {
			session.close ();
			resolve ({ error: error, varbinds: varbinds });
		});
	});
}

function assertUnknownUserName (result) {
	assert.ok (result.error, 'expected the request to be rejected');
	assert.ok (result.error instanceof snmp.ResponseInvalidError, result.error.message);
	assert.strictEqual (result.error.code, snmp.ResponseInvalidCode.EAuthFailure);
	assert.match (result.error.message, /Unknown User Name/);
}

function assertNoAccess (result) {
	assert.ok (result.error, 'expected the request to be refused');
	assert.ok (result.error instanceof snmp.RequestFailedError, result.error.message);
	assert.strictEqual (result.error.status, snmp.ErrorStatus.NoAccess);
}

describe ('SNMPv3 empty user name', function () {

	this.timeout (5000);

	describe ('Agent with default access control', function () {
		const port = 17261;
		let agent;

		beforeEach (function () {
			agent = createAgent (port, {}, [fred]);
		});

		afterEach (function (done) {
			agent.close (() => done ());
		});

		it ('rejects a get from an empty user name', async function () {
			assertUnknownUserName (await get (port, emptyUser));
		});

		it ('rejects a get-next from an empty user name', async function () {
			assertUnknownUserName (await getNext (port, emptyUser));
		});

		it ('rejects a set from an empty user name and leaves the value unchanged', async function () {
			assertUnknownUserName (await set (port, emptyUser, 'CHANGED'));
			const result = await get (port, fred);
			assert.ifError (result.error);
			assert.strictEqual (result.varbinds[0].value.toString (), 'ORIGINAL');
		});

		it ('still serves a configured user, including engine ID discovery', async function () {
			// The session's first request is a discovery GetRequest, which is
			// always sent with a zero-length user name, so this also checks
			// that empty-user discovery is still answered
			const result = await get (port, fred);
			assert.ifError (result.error);
			assert.strictEqual (result.varbinds[0].value.toString (), 'ORIGINAL');
		});

		it ('reports the rejection to the agent callback when not reportable', async function () {
			// A trap-style (non-reportable) request is rejected without a report
			const session = createV3Session (port, emptyUser, { trapPort: port });
			await new Promise (resolve => session.trap (snmp.TrapType.ColdStart, () => resolve ()));
			session.close ();
			await new Promise (resolve => setTimeout (resolve, 100));
			assert.ok (agent.errors.some (error => /empty user name/.test (error.message)),
					'expected an empty user name error in the agent callback');
		});
	});

	describe ('Agent with only communities configured', function () {
		const port = 17262;
		let agent;

		beforeEach (function () {
			agent = createAgent (port, {}, [], ['public']);
		});

		afterEach (function (done) {
			agent.close (() => done ());
		});

		it ('rejects a get from an empty user name', async function () {
			assertUnknownUserName (await get (port, emptyUser));
		});

		it ('rejects a set from an empty user name', async function () {
			assertUnknownUserName (await set (port, emptyUser, 'CHANGED'));
		});
	});

	describe ('Agent with simple access control', function () {
		const port = 17263;
		let agent;

		beforeEach (function () {
			agent = createAgent (port, { accessControlModelType: snmp.AccessControlModelType.Simple }, [fred]);
			agent.getAuthorizer ().getAccessControlModel ().setUserAccess ('fred', snmp.AccessLevel.ReadWrite);
		});

		afterEach (function (done) {
			agent.close (() => done ());
		});

		it ('rejects get, get-next and set from an empty user name', async function () {
			assertUnknownUserName (await get (port, emptyUser));
			assertUnknownUserName (await getNext (port, emptyUser));
			assertUnknownUserName (await set (port, emptyUser, 'CHANGED'));
		});
	});

	describe ('Agent with authorization disabled', function () {
		const port = 17264;
		let agent;

		beforeEach (function () {
			agent = createAgent (port, { disableAuthorization: true }, []);
		});

		afterEach (function (done) {
			agent.close (() => done ());
		});

		it ('still serves an empty user name', async function () {
			const result = await get (port, emptyUser);
			assert.ifError (result.error);
			assert.strictEqual (result.varbinds[0].value.toString (), 'ORIGINAL');
		});
	});

	describe ('Receiver', function () {
		const port = 17265;
		let receiver;
		let notifications;
		let errors;

		beforeEach (function () {
			notifications = [];
			errors = [];
			receiver = snmp.createReceiver ({ port: port, includeAuthentication: true }, (error, notification) => {
				if ( error ) {
					errors.push (error);
				} else {
					notifications.push (notification);
				}
			});
			receiver.getAuthorizer ().addUser (fred);
		});

		afterEach (function (done) {
			receiver.close (() => done ());
		});

		function trap (user) {
			return new Promise (resolve => {
				const session = createV3Session (port, user, { trapPort: port });
				session.trap (snmp.TrapType.ColdStart, (error) => {
					session.close ();
					resolve (error);
				});
			});
		}

		function inform (user) {
			return new Promise (resolve => {
				const session = createV3Session (port, user, { trapPort: port });
				session.inform (snmp.TrapType.ColdStart, (error) => {
					session.close ();
					resolve (error);
				});
			});
		}

		it ('does not deliver a trap from an empty user name', async function () {
			await trap (emptyUser);
			await new Promise (resolve => setTimeout (resolve, 100));
			assert.strictEqual (notifications.length, 0);
			assert.ok (errors.some (error => /empty user name/.test (error.message)));
		});

		it ('rejects an inform from an empty user name with an unknown user name report', async function () {
			const error = await inform (emptyUser);
			assertUnknownUserName ({ error: error });
			assert.strictEqual (notifications.length, 0);
		});

		it ('still delivers a trap and an inform from a configured user', async function () {
			assert.ifError (await trap (fred));
			assert.ifError (await inform (fred));
			await new Promise (resolve => setTimeout (resolve, 100));
			assert.strictEqual (notifications.length, 2);
		});
	});
});

describe ('Proxy forwarder access control', function () {

	this.timeout (5000);

	const backendPort = 17266;
	const frontPort = 17267;
	let backend;
	let front;

	beforeEach (function (done) {
		backend = createAgent (backendPort, {}, [fred]);
		front = createAgent (frontPort, { accessControlModelType: snmp.AccessControlModelType.Simple }, [fred, operator]);
		// operator keeps the default ReadOnly level given by addUser
		front.getAuthorizer ().getAccessControlModel ().setUserAccess ('fred', snmp.AccessLevel.ReadWrite);
		front.getForwarder ().addProxy ({
			context: 'devB',
			transport: 'udp4',
			target: '127.0.0.1',
			port: backendPort,
			user: fred
		});
		// allow the forwarder's discovery of the backend to complete
		setTimeout (done, 300);
	});

	afterEach (function (done) {
		front.close (() => backend.close (() => done ()));
	});

	it ('forwards a get from a read-only user', async function () {
		const result = await get (frontPort, operator, { context: 'devB' });
		assert.ifError (result.error);
		assert.strictEqual (result.varbinds[0].value.toString (), 'ORIGINAL');
	});

	it ('refuses a set from a read-only user without forwarding it', async function () {
		assertNoAccess (await set (frontPort, operator, 'CHANGED', { context: 'devB' }));
		const result = await get (backendPort, fred);
		assert.ifError (result.error);
		assert.strictEqual (result.varbinds[0].value.toString (), 'ORIGINAL');
	});

	it ('forwards a set from a read-write user', async function () {
		const result = await set (frontPort, fred, 'CHANGED', { context: 'devB' });
		assert.ifError (result.error);
		const check = await get (backendPort, fred);
		assert.ifError (check.error);
		assert.strictEqual (check.varbinds[0].value.toString (), 'CHANGED');
	});

	it ('rejects a request from an empty user name', async function () {
		assertUnknownUserName (await get (frontPort, emptyUser, { context: 'devB' }));
		assertUnknownUserName (await set (frontPort, emptyUser, 'CHANGED', { context: 'devB' }));
	});
});
