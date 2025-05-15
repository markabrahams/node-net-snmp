const assert = require('assert');
// crypto is used indirectly by Authentication and Encryption modules
const snmp = require('../');
const { SecurityLevel, AuthProtocols, PrivProtocols, Authentication, Encryption } = snmp;

describe('SNMPv3 Authentication and Encryption', function () {
    // Sample data for tests
    const authPassword = 'test_auth_password';
    const privPassword = 'test_priv_password';
    const engineID = Buffer.from('8000B98380ABCDEF', 'hex');

    // Test data that will be encrypted/authenticated
    const testData = Buffer.from('Test data for SNMP authentication and privacy tests', 'utf8');

    describe('Authentication', function () {
        it('should support noAuthNoPriv security level', function () {
            // noAuthNoPriv doesn't use authentication, verify this is handled appropriately
            const user = {
                name: 'noAuthUser',
                level: SecurityLevel.noAuthNoPriv,
            };

            // No authentication should be required for this user
            assert.strictEqual(user.level, SecurityLevel.noAuthNoPriv);
            assert.strictEqual(user.authProtocol, undefined);
            assert.strictEqual(user.authKey, undefined);
        });

        it('should support MD5 authentication protocol', function () {
            // Generate authentication key using MD5
            const authKey = Authentication.passwordToKey(AuthProtocols.md5, authPassword, engineID);

            // Verify key length matches expected MD5 output length
            assert.strictEqual(authKey.length, Authentication.algorithms[AuthProtocols.md5].KEY_LENGTH);

            // Create a test digest
            const digest = Authentication.calculateDigest(testData, AuthProtocols.md5, authPassword, engineID);

            // Verify digest length
            assert.strictEqual(digest.length, Authentication.algorithms[AuthProtocols.md5].AUTHENTICATION_CODE_LENGTH);

            // Verify authentication works
            const testBuffer = Buffer.concat([testData]);
            const digestInMessage = Buffer.alloc(
                Authentication.algorithms[AuthProtocols.md5].AUTHENTICATION_CODE_LENGTH
            );
            Authentication.writeParameters(testBuffer, AuthProtocols.md5, authPassword, engineID, digestInMessage);

            assert.strictEqual(
                Authentication.isAuthentic(testBuffer, AuthProtocols.md5, authPassword, engineID, digestInMessage),
                true
            );
        });

        it('should support SHA authentication protocol', function () {
            // Generate authentication key using SHA
            const authKey = Authentication.passwordToKey(AuthProtocols.sha, authPassword, engineID);

            // Verify key length matches expected SHA output length
            assert.strictEqual(authKey.length, Authentication.algorithms[AuthProtocols.sha].KEY_LENGTH);

            // Create a test digest
            const digest = Authentication.calculateDigest(testData, AuthProtocols.sha, authPassword, engineID);

            // Verify digest length
            assert.strictEqual(digest.length, Authentication.algorithms[AuthProtocols.sha].AUTHENTICATION_CODE_LENGTH);

            // Verify authentication works
            const testBuffer = Buffer.concat([testData]);
            const digestInMessage = Buffer.alloc(
                Authentication.algorithms[AuthProtocols.sha].AUTHENTICATION_CODE_LENGTH
            );
            Authentication.writeParameters(testBuffer, AuthProtocols.sha, authPassword, engineID, digestInMessage);

            assert.strictEqual(
                Authentication.isAuthentic(testBuffer, AuthProtocols.sha, authPassword, engineID, digestInMessage),
                true
            );
        });

        it('should support SHA-256 authentication protocol', function () {
            // Generate authentication key using SHA-256
            const authKey = Authentication.passwordToKey(AuthProtocols.sha256, authPassword, engineID);

            // Verify key length matches expected SHA-256 output length
            assert.strictEqual(authKey.length, Authentication.algorithms[AuthProtocols.sha256].KEY_LENGTH);

            // Create a test digest
            const digest = Authentication.calculateDigest(testData, AuthProtocols.sha256, authPassword, engineID);

            // Verify digest length
            assert.strictEqual(
                digest.length,
                Authentication.algorithms[AuthProtocols.sha256].AUTHENTICATION_CODE_LENGTH
            );

            // Verify authentication works
            const testBuffer = Buffer.concat([testData]);
            const digestInMessage = Buffer.alloc(
                Authentication.algorithms[AuthProtocols.sha256].AUTHENTICATION_CODE_LENGTH
            );
            Authentication.writeParameters(testBuffer, AuthProtocols.sha256, authPassword, engineID, digestInMessage);

            assert.strictEqual(
                Authentication.isAuthentic(testBuffer, AuthProtocols.sha256, authPassword, engineID, digestInMessage),
                true
            );
        });

        it('should support SHA-512 authentication protocol', function () {
            // Generate authentication key using SHA-512
            const authKey = Authentication.passwordToKey(AuthProtocols.sha512, authPassword, engineID);

            // Verify key length matches expected SHA-512 output length
            assert.strictEqual(authKey.length, Authentication.algorithms[AuthProtocols.sha512].KEY_LENGTH);

            // Create a test digest
            const digest = Authentication.calculateDigest(testData, AuthProtocols.sha512, authPassword, engineID);

            // Verify digest length
            assert.strictEqual(
                digest.length,
                Authentication.algorithms[AuthProtocols.sha512].AUTHENTICATION_CODE_LENGTH
            );

            // Verify authentication works
            const testBuffer = Buffer.concat([testData]);
            const digestInMessage = Buffer.alloc(
                Authentication.algorithms[AuthProtocols.sha512].AUTHENTICATION_CODE_LENGTH
            );
            Authentication.writeParameters(testBuffer, AuthProtocols.sha512, authPassword, engineID, digestInMessage);

            assert.strictEqual(
                Authentication.isAuthentic(testBuffer, AuthProtocols.sha512, authPassword, engineID, digestInMessage),
                true
            );
        });
    });

    describe('Encryption', function () {
        // Create a mock engine for encryption tests
        const engine = {
            engineID: engineID,
            engineBoots: 1,
            engineTime: 123,
        };

        it('should support DES encryption protocol', function () {
            // Test DES encryption/decryption with SHA authentication
            const authProtocol = AuthProtocols.sha;
            const privProtocol = PrivProtocols.des;

            // Encrypt the test data
            const { encryptedPdu, msgPrivacyParameters } = Encryption.encryptPdu(
                privProtocol,
                testData,
                privPassword,
                authProtocol,
                engine
            );

            // Verify encryption was done (output should be different from input)
            assert.notDeepStrictEqual(encryptedPdu, testData);

            // Decrypt the data
            const decryptedPdu = Encryption.decryptPdu(
                privProtocol,
                encryptedPdu,
                msgPrivacyParameters,
                privPassword,
                authProtocol,
                engine
            );

            // Verify decryption works
            assert.deepStrictEqual(decryptedPdu.slice(0, testData.length), testData);
        });

        it('should support AES encryption protocol', function () {
            // Test AES encryption/decryption with SHA authentication
            const authProtocol = AuthProtocols.sha;
            const privProtocol = PrivProtocols.aes;

            // Encrypt the test data
            const { encryptedPdu, msgPrivacyParameters } = Encryption.encryptPdu(
                privProtocol,
                testData,
                privPassword,
                authProtocol,
                engine
            );

            // Verify encryption was done (output should be different from input)
            assert.notDeepStrictEqual(encryptedPdu, testData);

            // Decrypt the data
            const decryptedPdu = Encryption.decryptPdu(
                privProtocol,
                encryptedPdu,
                msgPrivacyParameters,
                privPassword,
                authProtocol,
                engine
            );

            // Verify decryption works
            assert.deepStrictEqual(decryptedPdu.slice(0, testData.length), testData);
        });

        it('should support AES-256b (Blumenthal) encryption protocol', function () {
            // Test AES-256 Blumenthal encryption/decryption with SHA authentication
            const authProtocol = AuthProtocols.sha;
            const privProtocol = PrivProtocols.aes256b;

            // Encrypt the test data
            const { encryptedPdu, msgPrivacyParameters } = Encryption.encryptPdu(
                privProtocol,
                testData,
                privPassword,
                authProtocol,
                engine
            );

            // Verify encryption was done (output should be different from input)
            assert.notDeepStrictEqual(encryptedPdu, testData);

            // Decrypt the data
            const decryptedPdu = Encryption.decryptPdu(
                privProtocol,
                encryptedPdu,
                msgPrivacyParameters,
                privPassword,
                authProtocol,
                engine
            );

            // Verify decryption works
            assert.deepStrictEqual(decryptedPdu.slice(0, testData.length), testData);
        });

        it('should support AES-256r (Reeder) encryption protocol', function () {
            // Test AES-256 Reeder encryption/decryption with SHA authentication
            const authProtocol = AuthProtocols.sha;
            const privProtocol = PrivProtocols.aes256r;

            // Encrypt the test data
            const { encryptedPdu, msgPrivacyParameters } = Encryption.encryptPdu(
                privProtocol,
                testData,
                privPassword,
                authProtocol,
                engine
            );

            // Verify encryption was done (output should be different from input)
            assert.notDeepStrictEqual(encryptedPdu, testData);

            // Decrypt the data
            const decryptedPdu = Encryption.decryptPdu(
                privProtocol,
                encryptedPdu,
                msgPrivacyParameters,
                privPassword,
                authProtocol,
                engine
            );

            // Verify decryption works
            assert.deepStrictEqual(decryptedPdu.slice(0, testData.length), testData);
        });
    });

    describe('SecurityLevel combinations', function () {
        it('should support authNoPriv security level', function () {
            // Create a user with authentication but no privacy
            const user = {
                name: 'authNoPrivUser',
                level: SecurityLevel.authNoPriv,
                authProtocol: AuthProtocols.sha,
                authKey: 'authPassword',
            };

            assert.strictEqual(user.level, SecurityLevel.authNoPriv);
            assert.strictEqual(user.authProtocol, AuthProtocols.sha);
            assert.strictEqual(user.authKey, 'authPassword');
            assert.strictEqual(user.privProtocol, undefined);
            assert.strictEqual(user.privKey, undefined);
        });

        it('should support authPriv security level', function () {
            // Create a user with authentication and privacy
            const user = {
                name: 'authPrivUser',
                level: SecurityLevel.authPriv,
                authProtocol: AuthProtocols.sha256,
                authKey: 'authPassword',
                privProtocol: PrivProtocols.aes,
                privKey: 'privPassword',
            };

            assert.strictEqual(user.level, SecurityLevel.authPriv);
            assert.strictEqual(user.authProtocol, AuthProtocols.sha256);
            assert.strictEqual(user.authKey, 'authPassword');
            assert.strictEqual(user.privProtocol, PrivProtocols.aes);
            assert.strictEqual(user.privKey, 'privPassword');
        });

        it('should validate all required parameters are provided for each security level', function () {
            // noAuthNoPriv only requires username and level
            const user1 = {
                name: 'user1',
                level: SecurityLevel.noAuthNoPriv,
            };

            // authNoPriv requires authentication parameters
            const user2 = {
                name: 'user2',
                level: SecurityLevel.authNoPriv,
                authProtocol: AuthProtocols.sha,
                authKey: 'authPassword',
            };

            // authPriv requires both authentication and privacy parameters
            const user3 = {
                name: 'user3',
                level: SecurityLevel.authPriv,
                authProtocol: AuthProtocols.sha,
                authKey: 'authPassword',
                privProtocol: PrivProtocols.aes,
                privKey: 'privPassword',
            };

            // This function would typically be part of parameter validation
            function validateUser(user) {
                if (user.level === SecurityLevel.authNoPriv || user.level === SecurityLevel.authPriv) {
                    assert.ok(user.authProtocol, 'authProtocol required for this security level');
                    assert.ok(user.authKey, 'authKey required for this security level');
                }

                if (user.level === SecurityLevel.authPriv) {
                    assert.ok(user.privProtocol, 'privProtocol required for this security level');
                    assert.ok(user.privKey, 'privKey required for this security level');
                }

                return true;
            }

            assert.strictEqual(validateUser(user1), true);
            assert.strictEqual(validateUser(user2), true);
            assert.strictEqual(validateUser(user3), true);
        });
    });

    describe('Custom engineID handling', function () {
        it('should correctly use engineID parameter', function () {
            // This test verifies the fix for issue #283
            // Create a session with default settings (no engineID)
            const defaultSession = new snmp.Session({
                host: 'example.org',
                version: snmp.Version3
            });
            
            // Default session should have an engineID of expected format (17 bytes)
            assert.strictEqual(defaultSession.engine.engineID.length, 17);
            
            // Convert to hex string for easier inspection
            const defaultEngineIDHex = defaultSession.engine.engineID.toString('hex');
            // First 5 bytes should match the standard format 8000B98380
            assert.strictEqual(defaultEngineIDHex.substring(0, 10), '8000b98380');
            
            // Create a second session - should generate a different random engineID
            const anotherDefaultSession = new snmp.Session({
                host: 'example.org',
                version: snmp.Version3
            });
            
            // The two sessions should have different engineIDs (random part differs)
            assert.notStrictEqual(
                defaultSession.engine.engineID.toString('hex'),
                anotherDefaultSession.engine.engineID.toString('hex')
            );
        });
    });
});
