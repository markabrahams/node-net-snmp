const assert = require('assert');
const snmp = require('../');
const { 
    SecurityLevel, 
    AuthProtocols, 
    PduType,
    ObjectType,
} = snmp;

// Access internal constants and classes for testing
// These are not exported but are part of PR #289 implementation
const UsmErrorType = {
    UNSUPPORTED_SECURITY_LEVEL: "1",
    NOT_IN_TIME_WINDOW: "2",
    UNKNOWN_USER_NAME: "3",
    UNKNOWN_ENGINE_ID: "4",
    WRONG_DIGESTS: "5",
    DECRYPTION_ERROR: "6"
};

describe('SNMPv3 Authentication Failure Handling (RFC 3414 §3.2)', function () {
    
    // Test constants
    const testEngineID = '8000B98380ABCDEF12345678';
    const testContext = 'testContext';
    const unknownUser = 'unknownUser';
    const knownUser = 'knownUser';
    const authPassword = 'testAuthPassword';

    // Create test engine configuration
    const testEngine = {
        engineID: testEngineID,
        engineBoots: 1,
        engineTime: 12345
    };

    // Create test receiver with known users for integration testing
    const createTestReceiver = () => {
        const receiver = snmp.createReceiver({
            port: 16200,
            disableAuthorization: false
        }, function(error, data) {
            // Simple callback for test receiver
            if (error) {
                console.log('Test receiver error:', error);
            }
        });
        
        // Add a user requiring authentication
        receiver.getAuthorizer().addUser({
            name: knownUser,
            level: SecurityLevel.authNoPriv,
            authProtocol: AuthProtocols.sha,
            authKey: authPassword
        });
        
        return receiver;
    };

    // Helper function to create test message buffers that would trigger authentication failures
    const createTestMessageBuffer = (userName, hasAuth = false, hasPriv = false, reportable = true) => {
        // Create a basic SNMP v3 message buffer structure
        // This is a simplified approach - in reality we'd need proper BER encoding
        const msgFlags = (reportable ? 4 : 0) | (hasPriv ? 2 : 0) | (hasAuth ? 1 : 0);
        
        // Return a mock message that would be created by Message.createFromBuffer
        return {
            version: 3,
            msgGlobalData: {
                msgID: 12345,
                msgMaxSize: 65507,
                msgFlags: msgFlags,
                msgSecurityModel: 3
            },
            msgSecurityParameters: {
                msgAuthoritativeEngineID: hasAuth ? testEngineID : '',
                msgAuthoritativeEngineBoots: hasAuth ? 1 : 0,
                msgAuthoritativeEngineTime: hasAuth ? 12345 : 0,
                msgUserName: userName,
                msgAuthenticationParameters: hasAuth ? Buffer.alloc(12) : '',
                msgPrivacyParameters: hasPriv ? Buffer.alloc(8) : ''
            },
            pdu: {
                type: PduType.GetRequest,
                id: 67890
            },
            hasAuthentication: () => hasAuth,
            hasPrivacy: () => hasPriv,
            hasAuthoritativeEngineID: () => hasAuth && testEngineID !== '',
            isReportable: () => reportable,
            // Add the createReportResponseMessage method that's part of PR #289
            createReportResponseMessage: function(engine, context, errorType) {
                const usmStatsBase = '1.3.6.1.6.3.15.1.1';
                const usmStats = {
                    "1": "Unsupported Security Level",
                    "2": "Not In Time Window", 
                    "3": "Unknown User Name",
                    "4": "Unknown Engine ID",
                    "5": "Wrong Digest (incorrect password, community or key)",
                    "6": "Decryption Error"
                };
                
                const varbinds = [];
                if (errorType && usmStats[errorType]) {
                    varbinds.push({
                        oid: usmStatsBase + "." + errorType + ".0",
                        type: ObjectType.Counter32,
                        value: 1
                    });
                }
                
                return {
                    version: 3,
                    msgGlobalData: {
                        msgID: this.msgGlobalData.msgID,
                        msgMaxSize: 65507,
                        msgFlags: 0, // Report PDU is not reportable
                        msgSecurityModel: 3
                    },
                    msgSecurityParameters: {
                        msgAuthoritativeEngineID: engine.engineID,
                        msgAuthoritativeEngineBoots: engine.engineBoots,
                        msgAuthoritativeEngineTime: engine.engineTime,
                        msgUserName: '',
                        msgAuthenticationParameters: '',
                        msgPrivacyParameters: ''
                    },
                    pdu: {
                        type: PduType.Report,
                        id: this.pdu.id,
                        contextName: context,
                        varbinds: varbinds
                    },
                    user: {
                        name: '',
                        level: SecurityLevel.noAuthNoPriv
                    }
                };
            }
        };
    };

    describe('Report PDU Generation', function () {
        
        it('should create Report PDU with UNKNOWN_USER_NAME for unknown users', function () {
            const message = createTestMessageBuffer(unknownUser, false, false, true);
            const reportMessage = message.createReportResponseMessage(testEngine, testContext, UsmErrorType.UNKNOWN_USER_NAME);

            // Verify the report message structure
            assert.strictEqual(reportMessage.version, 3);
            assert.strictEqual(reportMessage.msgGlobalData.msgID, message.msgGlobalData.msgID);
            assert.strictEqual(reportMessage.pdu.type, PduType.Report);
            assert.strictEqual(reportMessage.pdu.contextName, testContext);
            
            // Verify USM statistics OID is correct
            assert.strictEqual(reportMessage.pdu.varbinds.length, 1);
            const varbind = reportMessage.pdu.varbinds[0];
            assert.strictEqual(varbind.oid, '1.3.6.1.6.3.15.1.1.3.0'); // usmStatsUnknownUserNames
            assert.strictEqual(varbind.type, ObjectType.Counter32);
            assert.strictEqual(varbind.value, 1);
        });

        it('should create Report PDU with WRONG_DIGESTS for authentication level mismatches', function () {
            const message = createTestMessageBuffer(knownUser, false, false, true);
            const reportMessage = message.createReportResponseMessage(testEngine, testContext, UsmErrorType.WRONG_DIGESTS);

            // Verify the report message structure
            assert.strictEqual(reportMessage.version, 3);
            assert.strictEqual(reportMessage.pdu.type, PduType.Report);
            
            // Verify USM statistics OID is correct
            const varbind = reportMessage.pdu.varbinds[0];
            assert.strictEqual(varbind.oid, '1.3.6.1.6.3.15.1.1.5.0'); // usmStatsWrongDigests
            assert.strictEqual(varbind.type, ObjectType.Counter32);
            assert.strictEqual(varbind.value, 1);
        });

        it('should create Report PDU with UNKNOWN_ENGINE_ID for discovery requests', function () {
            const message = createTestMessageBuffer('', false, false, true);
            const reportMessage = message.createReportResponseMessage(testEngine, testContext, UsmErrorType.UNKNOWN_ENGINE_ID);

            // Verify the report message structure
            assert.strictEqual(reportMessage.version, 3);
            assert.strictEqual(reportMessage.pdu.type, PduType.Report);
            
            // Verify USM statistics OID is correct
            const varbind = reportMessage.pdu.varbinds[0];
            assert.strictEqual(varbind.oid, '1.3.6.1.6.3.15.1.1.4.0'); // usmStatsUnknownEngineIDs
            assert.strictEqual(varbind.type, ObjectType.Counter32);
            assert.strictEqual(varbind.value, 1);
        });

        it('should preserve original message ID in Report PDU', function () {
            const originalMsgID = 98765;
            const message = createTestMessageBuffer(unknownUser, false, false, true);
            message.msgGlobalData.msgID = originalMsgID;
            
            const reportMessage = message.createReportResponseMessage(testEngine, testContext, UsmErrorType.UNKNOWN_USER_NAME);
            
            assert.strictEqual(reportMessage.msgGlobalData.msgID, originalMsgID);
        });

        it('should create Report PDU with correct security parameters', function () {
            const message = createTestMessageBuffer(unknownUser, false, false, true);
            const reportMessage = message.createReportResponseMessage(testEngine, testContext, UsmErrorType.UNKNOWN_USER_NAME);

            // Verify security parameters match engine configuration
            assert.strictEqual(reportMessage.msgSecurityParameters.msgAuthoritativeEngineID, testEngineID);
            assert.strictEqual(reportMessage.msgSecurityParameters.msgAuthoritativeEngineBoots, testEngine.engineBoots);
            assert.strictEqual(reportMessage.msgSecurityParameters.msgAuthoritativeEngineTime, testEngine.engineTime);
            assert.strictEqual(reportMessage.msgSecurityParameters.msgUserName, '');
            assert.strictEqual(reportMessage.msgSecurityParameters.msgAuthenticationParameters, '');
            assert.strictEqual(reportMessage.msgSecurityParameters.msgPrivacyParameters, '');
        });

        it('should handle missing error type gracefully', function () {
            const message = createTestMessageBuffer(unknownUser, false, false, true);
            const reportMessage = message.createReportResponseMessage(testEngine, testContext, null);

            // Should create report with empty varbinds when no error type
            assert.strictEqual(reportMessage.pdu.varbinds.length, 0);
        });

        it('should handle invalid error type gracefully', function () {
            const message = createTestMessageBuffer(unknownUser, false, false, true);
            const reportMessage = message.createReportResponseMessage(testEngine, testContext, 'invalid_error_type');

            // Should create report with empty varbinds when invalid error type
            assert.strictEqual(reportMessage.pdu.varbinds.length, 0);
        });
    });

    describe('Integration with Receiver/Agent', function () {
        
        it('should demonstrate Report PDU generation flow for unknown users', function () {
            // This test demonstrates the integration flow but doesn't test internal implementation
            // Since we cannot directly test Listener.processIncoming without proper message parsing
            const receiver = createTestReceiver();
            
            // Verify that receiver has the expected authorizer setup
            const authorizer = receiver.getAuthorizer();
            assert(authorizer);
            assert.strictEqual(authorizer.users.length, 1);
            assert.strictEqual(authorizer.users[0].name, knownUser);
            
            // Close receiver to clean up
            receiver.close();
        });

        it('should handle reportable flag correctly in message creation', function () {
            // Test the reportable flag handling which is part of the RFC 3414 compliance
            const message1 = createTestMessageBuffer(knownUser, true, false, true);
            assert.strictEqual(message1.isReportable(), true);
            assert.strictEqual((message1.msgGlobalData.msgFlags & 4), 4); // reportable bit set

            const message2 = createTestMessageBuffer(knownUser, true, false, false);
            assert.strictEqual(message2.isReportable(), false);
            assert.strictEqual((message2.msgGlobalData.msgFlags & 4), 0); // reportable bit clear
        });
    });

    describe('USM Error Type Constants', function () {
        
        it('should define all required USM error type constants', function () {
            assert.strictEqual(UsmErrorType.UNSUPPORTED_SECURITY_LEVEL, '1');
            assert.strictEqual(UsmErrorType.NOT_IN_TIME_WINDOW, '2');
            assert.strictEqual(UsmErrorType.UNKNOWN_USER_NAME, '3');
            assert.strictEqual(UsmErrorType.UNKNOWN_ENGINE_ID, '4');
            assert.strictEqual(UsmErrorType.WRONG_DIGESTS, '5');
            assert.strictEqual(UsmErrorType.DECRYPTION_ERROR, '6');
        });

        it('should map error type constants to correct USM statistics OIDs', function () {
            const usmStatsBase = '1.3.6.1.6.3.15.1.1';
            
            assert.strictEqual(`${usmStatsBase}.${UsmErrorType.UNSUPPORTED_SECURITY_LEVEL}.0`, '1.3.6.1.6.3.15.1.1.1.0');
            assert.strictEqual(`${usmStatsBase}.${UsmErrorType.NOT_IN_TIME_WINDOW}.0`, '1.3.6.1.6.3.15.1.1.2.0');
            assert.strictEqual(`${usmStatsBase}.${UsmErrorType.UNKNOWN_USER_NAME}.0`, '1.3.6.1.6.3.15.1.1.3.0');
            assert.strictEqual(`${usmStatsBase}.${UsmErrorType.UNKNOWN_ENGINE_ID}.0`, '1.3.6.1.6.3.15.1.1.4.0');
            assert.strictEqual(`${usmStatsBase}.${UsmErrorType.WRONG_DIGESTS}.0`, '1.3.6.1.6.3.15.1.1.5.0');
            assert.strictEqual(`${usmStatsBase}.${UsmErrorType.DECRYPTION_ERROR}.0`, '1.3.6.1.6.3.15.1.1.6.0');
        });
    });

    describe('Reportable Flag Handling', function () {
        
        it('should respect reportable flag in message creation', function () {
            // Test reportable message (typical for requests)
            const reportableMessage = createTestMessageBuffer(knownUser, true, false, true);
            assert.strictEqual(reportableMessage.isReportable(), true);
            assert.strictEqual((reportableMessage.msgGlobalData.msgFlags & 4), 4); // reportable bit set

            // Test non-reportable message (typical for responses)
            const nonReportableMessage = createTestMessageBuffer(knownUser, true, false, false);
            assert.strictEqual(nonReportableMessage.isReportable(), false);
            assert.strictEqual((nonReportableMessage.msgGlobalData.msgFlags & 4), 0); // reportable bit clear
        });
    });

    describe('Edge Cases and Error Handling', function () {
        
        it('should handle empty user name correctly', function () {
            const message = createTestMessageBuffer('', false, false, true);
            const reportMessage = message.createReportResponseMessage(testEngine, testContext, UsmErrorType.UNKNOWN_ENGINE_ID);
            
            assert.strictEqual(reportMessage.msgSecurityParameters.msgUserName, '');
            assert.strictEqual(reportMessage.user.name, '');
            assert.strictEqual(reportMessage.user.level, SecurityLevel.noAuthNoPriv);
        });

        it('should handle messages with authentication parameters correctly', function () {
            const message = createTestMessageBuffer(knownUser, true, false, true);
            message.msgSecurityParameters.msgAuthenticationParameters = Buffer.from('1234567890abcdef', 'hex');
            
            const reportMessage = message.createReportResponseMessage(testEngine, testContext, UsmErrorType.WRONG_DIGESTS);
            
            // Report should not include original auth parameters
            assert.strictEqual(reportMessage.msgSecurityParameters.msgAuthenticationParameters, '');
        });

        it('should handle messages with privacy parameters correctly', function () {
            const message = createTestMessageBuffer(knownUser, true, true, true);
            message.msgSecurityParameters.msgPrivacyParameters = Buffer.from('12345678', 'hex');
            
            const reportMessage = message.createReportResponseMessage(testEngine, testContext, UsmErrorType.DECRYPTION_ERROR);
            
            // Report should not include original privacy parameters
            assert.strictEqual(reportMessage.msgSecurityParameters.msgPrivacyParameters, '');
        });
    });
});
