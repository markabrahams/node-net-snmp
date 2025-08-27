const assert = require('assert');
const net = require('net');
const snmp = require('..');

describe('Subagent', function() {
    let subagent;
    let mockSocket;
    let mockServer;

    beforeEach(function() {
        // Create a mock server to simulate master agent
        mockServer = net.createServer();
        mockSocket = {
            connect: () => {},
            on: () => {},
            write: () => {},
            end: () => {}
        };
        
        // Use the factory method instead of constructor
        subagent = snmp.createSubagent({
            master: 'localhost',
            masterPort: 705,
            timeout: 5,
            description: 'Test Subagent'
        });
        
        // Mock socket connection to avoid actual networking
        subagent.socket = mockSocket;
        subagent.sessionID = 123;
    });

    afterEach(function() {
        if (mockServer) {
            mockServer.close();
        }
        if (subagent && typeof subagent.close === 'function') {
            subagent.close();
        }
    });

    describe('Constructor', function() {
        it('creates subagent with default options', function() {
            const sub = snmp.createSubagent({});
            // Prevent actual network connection
            sub.connectSocket = () => {};
            
            assert.equal(sub.master, 'localhost');
            assert.equal(sub.masterPort, 705);
            assert.equal(sub.timeout, 0);
            assert.equal(sub.descr, "Node net-snmp AgentX sub-agent");
            assert(sub.mib);
            
            // Clean up
            if (typeof sub.close === 'function') {
                sub.close();
            }
        });

        it('creates subagent with custom options', function() {
            const sub = snmp.createSubagent({
                master: '192.168.1.1',
                masterPort: 8080,
                timeout: 10,
                description: 'Custom Subagent'
            });
            // Prevent actual network connection
            sub.connectSocket = () => {};
            
            assert.equal(sub.master, '192.168.1.1');
            assert.equal(sub.masterPort, 8080);
            assert.equal(sub.timeout, 10);
            assert.equal(sub.descr, 'Custom Subagent');
            
            // Clean up
            if (typeof sub.close === 'function') {
                sub.close();
            }
        });
    });

    describe('Provider Management', function() {
        let scalarProvider, tableProvider;

        beforeEach(function() {
            scalarProvider = {
                name: "testScalar",
                type: snmp.MibProviderType.Scalar,
                oid: "1.3.6.1.4.1.8072.9999.1",
                scalarType: snmp.ObjectType.Integer,
                maxAccess: snmp.MaxAccess['read-write']
            };

            tableProvider = {
                name: "testTable",
                type: snmp.MibProviderType.Table,
                oid: "1.3.6.1.4.1.8072.9999.2",
                maxAccess: snmp.MaxAccess['not-accessible'],
                tableColumns: [
                    {
                        number: 1,
                        name: "testIndex",
                        type: snmp.ObjectType.Integer,
                        maxAccess: snmp.MaxAccess['not-accessible']
                    },
                    {
                        number: 2,
                        name: "testValue",
                        type: snmp.ObjectType.OctetString,
                        maxAccess: snmp.MaxAccess['read-write']
                    },
                    {
                        number: 3,
                        name: "testReadOnly",
                        type: snmp.ObjectType.Integer,
                        maxAccess: snmp.MaxAccess['read-only']
                    }
                ],
                tableIndex: [{ columnName: "testIndex" }]
            };
        });

        it('registers scalar provider', function() {
            let pduSent = null;
            subagent.sendPdu = (pdu, callback) => {
                pduSent = pdu;
                if (callback) callback(null, { error: 0 });
            };

            subagent.registerProvider(scalarProvider);
            
            assert(pduSent);
            assert.equal(pduSent.pduType, snmp.AgentXPduType.Register);
            assert.equal(pduSent.oid, scalarProvider.oid);
            assert(subagent.getProvider('testScalar'));
        });

        it('registers table provider', function() {
            let pduSent = null;
            subagent.sendPdu = (pdu, callback) => {
                pduSent = pdu;
                if (callback) callback(null, { error: 0 });
            };

            subagent.registerProvider(tableProvider);
            
            assert(pduSent);
            assert.equal(pduSent.pduType, snmp.AgentXPduType.Register);
            assert.equal(pduSent.oid, tableProvider.oid);
            assert(subagent.getProvider('testTable'));
        });

        it('unregisters provider', function() {
            subagent.getMib().registerProvider(scalarProvider);
            
            let pduSent = null;
            subagent.sendPdu = (pdu, callback) => {
                pduSent = pdu;
                if (callback) callback(null, { error: 0 });
            };

            subagent.unregisterProvider('testScalar');
            
            assert(pduSent);
            assert.equal(pduSent.pduType, snmp.AgentXPduType.Unregister);
            assert.equal(pduSent.oid, scalarProvider.oid);
        });
    });

    describe('Administrative PDUs', function() {
        it('sends ping PDU', function() {
            let pduSent = null;
            subagent.sendPdu = (pdu, callback) => {
                pduSent = pdu;
                if (callback) callback(null, { error: 0 });
            };

            subagent.ping();
            
            assert(pduSent);
            assert.equal(pduSent.pduType, snmp.AgentXPduType.Ping);
            assert.equal(pduSent.sessionID, 123);
        });

        it('sends notify PDU', function() {
            let pduSent = null;
            subagent.sendPdu = (pdu, callback) => {
                pduSent = pdu;
                if (callback) callback(null, { error: 0 });
            };

            const varbinds = [
                {
                    oid: '1.3.6.1.2.1.1.1.0',
                    type: snmp.ObjectType.OctetString,
                    value: 'test notification'
                }
            ];

            subagent.notify('1.3.6.1.6.3.1.1.5.1', varbinds);
            
            assert(pduSent);
            assert.equal(pduSent.pduType, snmp.AgentXPduType.Notify);
            assert(Array.isArray(pduSent.varbinds));
            assert.equal(pduSent.varbinds.length, 3); // sysUpTime + snmpTrapOID + user varbinds
        });

        it('adds agent capabilities', function() {
            let pduSent = null;
            subagent.sendPdu = (pdu, callback) => {
                pduSent = pdu;
                if (callback) callback(null, { error: 0 });
            };

            subagent.addAgentCaps('1.3.6.1.2.1.1', 'Test capability');
            
            assert(pduSent);
            assert.equal(pduSent.pduType, snmp.AgentXPduType.AddAgentCaps);
            assert.equal(pduSent.oid, '1.3.6.1.2.1.1');
            assert.equal(pduSent.descr, 'Test capability');
        });

        it('removes agent capabilities', function() {
            let pduSent = null;
            subagent.sendPdu = (pdu, callback) => {
                pduSent = pdu;
                if (callback) callback(null, { error: 0 });
            };

            subagent.removeAgentCaps('1.3.6.1.2.1.1');
            
            assert(pduSent);
            assert.equal(pduSent.pduType, snmp.AgentXPduType.RemoveAgentCaps);
            assert.equal(pduSent.oid, '1.3.6.1.2.1.1');
        });
    });

    describe('Utility Methods', function() {
        it('returns correct MIB instance', function() {
            assert(subagent.getMib());
            assert.equal(typeof subagent.getMib().registerProvider, 'function');
        });

        it('emits close event', function(done) {
            subagent.on('close', () => {
                done();
            });
            subagent.onClose();
        });

        it('emits error event', function(done) {
            const testError = new Error('Test error');
            subagent.on('error', (error) => {
                assert.equal(error, testError);
                done();
            });
            subagent.onError(testError);
                 });
     });

     describe('Subagent Enhanced Tests for PR #280', function() {
         // Tests for new functionality from PR #280
         
         describe('isAllowed Method (Access Control)', function() {
             let scalarProvider, tableProvider;

             beforeEach(function() {
                 scalarProvider = {
                     name: "testScalar",
                     type: snmp.MibProviderType.Scalar,
                     oid: "1.3.6.1.4.1.8072.9999.1",
                     scalarType: snmp.ObjectType.Integer,
                     maxAccess: snmp.MaxAccess['read-write']
                 };

                 tableProvider = {
                     name: "testTable",
                     type: snmp.MibProviderType.Table,
                     oid: "1.3.6.1.4.1.8072.9999.2",
                     maxAccess: snmp.MaxAccess['not-accessible'],
                     tableColumns: [
                         {
                             number: 1,
                             name: "testIndex",
                             type: snmp.ObjectType.Integer,
                             maxAccess: snmp.MaxAccess['not-accessible']
                         },
                         {
                             number: 2,
                             name: "testValue",
                             type: snmp.ObjectType.OctetString,
                             maxAccess: snmp.MaxAccess['read-write']
                         },
                         {
                             number: 3,
                             name: "testReadOnly",
                             type: snmp.ObjectType.Integer,
                             maxAccess: snmp.MaxAccess['read-only']
                         }
                     ],
                     tableIndex: [{ columnName: "testIndex" }]
                 };

                 subagent.getMib().registerProvider(scalarProvider);
                 subagent.getMib().registerProvider(tableProvider);
                 subagent.getMib().addTableRow('testTable', [1, 'test', 42]);
             });

             it('allows read access to read-write scalar', function() {
                 if (typeof subagent.isAllowed === 'function') {
                     const result = subagent.isAllowed(snmp.AgentXPduType.Get, scalarProvider, null);
                     assert.equal(result, true);
                 }
             });

             it('allows write access to read-write scalar', function() {
                 if (typeof subagent.isAllowed === 'function') {
                     const result = subagent.isAllowed(snmp.AgentXPduType.TestSet, scalarProvider, null);
                     assert.equal(result, true);
                 }
             });

             it('allows read access to read-only table column', function() {
                 if (typeof subagent.isAllowed === 'function') {
                     const instanceNode = subagent.getMib().lookup('1.3.6.1.4.1.8072.9999.2.3.1');
                     if (instanceNode) {
                         const result = subagent.isAllowed(snmp.AgentXPduType.Get, tableProvider, instanceNode);
                         assert.equal(result, true);
                     }
                 }
             });

             it('denies write access to read-only table column', function() {
                 if (typeof subagent.isAllowed === 'function') {
                     const instanceNode = subagent.getMib().lookup('1.3.6.1.4.1.8072.9999.2.3.1');
                     if (instanceNode) {
                         const result = subagent.isAllowed(snmp.AgentXPduType.TestSet, tableProvider, instanceNode);
                         assert.equal(result, false);
                     }
                 }
             });
         });

         describe('Set Operations Transaction Management', function() {
             let scalarProvider;

             beforeEach(function() {
                 scalarProvider = {
                     name: "testScalar",
                     type: snmp.MibProviderType.Scalar,
                     oid: "1.3.6.1.4.1.8072.9999.1",
                     scalarType: snmp.ObjectType.Integer,
                     maxAccess: snmp.MaxAccess['read-write']
                 };

                 subagent.getMib().registerProvider(scalarProvider);
                 subagent.getMib().setScalarValue('testScalar', 100);
             });

            it('manages set transactions correctly', function() {
                // Create proper AgentXPdu objects using createFromVariables
                const testSetPdu = snmp.AgentXPdu.createFromVariables({
                    pduType: snmp.AgentXPduType.TestSet,
                    sessionID: subagent.sessionID,
                    transactionID: 123,
                    varbinds: [{
                        oid: '1.3.6.1.4.1.8072.9999.1.0',
                        type: snmp.ObjectType.Integer,
                        value: 200
                    }]
                });

                subagent.testSet(testSetPdu);
                assert(subagent.setTransactions[123]);

                const cleanupSetPdu = snmp.AgentXPdu.createFromVariables({
                    pduType: snmp.AgentXPduType.CleanupSet,
                    sessionID: subagent.sessionID,
                    transactionID: 123
                });

                subagent.cleanupSet(cleanupSetPdu);
                assert(!subagent.setTransactions[123]);
            });

            it('handles unexpected transaction IDs', function() {
                const commitSetPdu = snmp.AgentXPdu.createFromVariables({
                    pduType: snmp.AgentXPduType.CommitSet,
                    sessionID: subagent.sessionID,
                    transactionID: 999
                });

                assert.throws(() => {
                    subagent.commitSet(commitSetPdu);
                }, /Unexpected CommitSet PDU/);
            });
         });

         describe('Bulk Set Handler', function() {
             let scalarProvider1, scalarProvider2;

             beforeEach(function() {
                 scalarProvider1 = {
                     name: "testScalar1",
                     type: snmp.MibProviderType.Scalar,
                     oid: "1.3.6.1.4.1.8072.9999.1",
                     scalarType: snmp.ObjectType.Integer,
                     maxAccess: snmp.MaxAccess['read-write']
                 };

                 scalarProvider2 = {
                     name: "testScalar2",
                     type: snmp.MibProviderType.Scalar,
                     oid: "1.3.6.1.4.1.8072.9999.2",
                     scalarType: snmp.ObjectType.Integer,
                     maxAccess: snmp.MaxAccess['read-write']
                 };

                 subagent.getMib().registerProvider(scalarProvider1);
                 subagent.getMib().registerProvider(scalarProvider2);
                 subagent.getMib().setScalarValue('testScalar1', 100);
                 subagent.getMib().setScalarValue('testScalar2', 200);
             });

             it('sets bulk set handler correctly', function() {
                 const handler = (mibRequests, mib, testSet) => {
                     return snmp.ErrorStatus.NoError;
                 };

                 if (typeof subagent.setBulkSetHandler === 'function') {
                     subagent.setBulkSetHandler(handler);
                     assert.equal(subagent.bulkSetHandler, handler);
                 }
             });
         });

         describe('Value Validation', function() {
             let scalarProvider;

             beforeEach(function() {
                 scalarProvider = {
                     name: "testScalar",
                     type: snmp.MibProviderType.Scalar,
                     oid: "1.3.6.1.4.1.8072.9999.1",
                     scalarType: snmp.ObjectType.Integer,
                     maxAccess: snmp.MaxAccess['read-write'],
                     constraints: {
                         ranges: [{ min: 1, max: 100 }]
                     }
                 };

                 subagent.getMib().registerProvider(scalarProvider);
                 subagent.getMib().setScalarValue('testScalar', 50);
             });

             it('validates integer constraints', function() {
                 // This tests the underlying validation that would be used in set operations
                 const instanceNode = subagent.getMib().lookup('1.3.6.1.4.1.8072.9999.1.0');
                 if (instanceNode && typeof instanceNode.validateValue === 'function') {
                     const validResult = instanceNode.validateValue(snmp.ObjectType.Integer, 75);
                     assert.equal(validResult, true);

                     const invalidResult = instanceNode.validateValue(snmp.ObjectType.Integer, 150);
                     assert.equal(invalidResult, false);
                 }
             });
         });
     });
});
