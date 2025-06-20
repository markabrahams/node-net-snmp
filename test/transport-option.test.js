const assert = require('assert');
const snmp = require('../index.js');

describe('Transport Option Handling in createV3Session', function() {
    const user = {
        name: "testuser",
        level: snmp.SecurityLevel.noAuthNoPriv
    };

    afterEach(function() {
        // Clean up any open sessions
        // Note: sessions are closed in individual tests
    });

    it('should use default transport when not specified', function() {
        const session = snmp.createV3Session("127.0.0.1", user);
        assert.strictEqual(session.transport, "udp4");
        session.close();
    });

    it('should use default transport when options is empty object', function() {
        const session = snmp.createV3Session("127.0.0.1", user, {});
        assert.strictEqual(session.transport, "udp4");
        session.close();
    });

    it('should preserve explicit udp4 transport', function() {
        const session = snmp.createV3Session("127.0.0.1", user, { transport: "udp4" });
        assert.strictEqual(session.transport, "udp4");
        session.close();
    });

    it('should preserve udp6 transport', function() {
        const session = snmp.createV3Session("127.0.0.1", user, { transport: "udp6" });
        assert.strictEqual(session.transport, "udp6");
        session.close();
    });

    it('should handle null transport by using default', function() {
        const session = snmp.createV3Session("127.0.0.1", user, { transport: null });
        assert.strictEqual(session.transport, "udp4");
        session.close();
    });

    it('should preserve invalid transport values (let Node.js validate)', function() {
        assert.throws(function() {
            snmp.createV3Session("127.0.0.1", user, { transport: "invalid" });
        }, function(err) {
            return err.code === 'ERR_SOCKET_BAD_TYPE';
        });
    });

});
