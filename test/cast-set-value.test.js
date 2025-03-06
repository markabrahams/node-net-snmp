const assert = require('assert');
const snmp = require('..');

describe('Cast Set Value', function() {

    describe('Boolean', function() {
        it('casts truthy values to true', function() {
            assert.strictEqual(snmp.ObjectTypeUtil.castSetValue(snmp.ObjectType.Boolean, 1), true);
            assert.strictEqual(snmp.ObjectTypeUtil.castSetValue(snmp.ObjectType.Boolean, "true"), true);
            assert.strictEqual(snmp.ObjectTypeUtil.castSetValue(snmp.ObjectType.Boolean, {}), true);
        });

        it('casts falsy values to false', function() {
            assert.strictEqual(snmp.ObjectTypeUtil.castSetValue(snmp.ObjectType.Boolean, 0), false);
            assert.strictEqual(snmp.ObjectTypeUtil.castSetValue(snmp.ObjectType.Boolean, ""), false);
            assert.strictEqual(snmp.ObjectTypeUtil.castSetValue(snmp.ObjectType.Boolean, null), false);
        });
    });

    describe('Integer', function() {
        it('accepts valid integers', function() {
            assert.strictEqual(snmp.ObjectTypeUtil.castSetValue(snmp.ObjectType.Integer, 42), 42);
            assert.strictEqual(snmp.ObjectTypeUtil.castSetValue(snmp.ObjectType.Integer, -42), -42);
            assert.strictEqual(snmp.ObjectTypeUtil.castSetValue(snmp.ObjectType.Integer, "42"), 42);
        });

        it('throws on invalid integers', function() {
            assert.throws(() => {
                snmp.ObjectTypeUtil.castSetValue(snmp.ObjectType.Integer, "not a number");
            }, /Invalid Integer/);

            assert.throws(() => {
                snmp.ObjectTypeUtil.castSetValue(snmp.ObjectType.Integer, {});
            }, /Invalid Integer/);
        });

        it('respects enumeration constraints', function() {
            const constraints = {
                enumeration: {
                    1: 'one',
                    2: 'two'
                }
            };

            assert.strictEqual(snmp.ObjectTypeUtil.castSetValue(snmp.ObjectType.Integer, 1, constraints), 1);

            assert.throws(() => {
                snmp.ObjectTypeUtil.castSetValue(snmp.ObjectType.Integer, 3, constraints);
            }, /Integer does not meet constraints/);
        });

        it('respects range constraints', function() {
            const constraints = {
                ranges: [
                    { min: 0, max: 10 }
                ]
            };

            assert.strictEqual(snmp.ObjectTypeUtil.castSetValue(snmp.ObjectType.Integer, 5, constraints), 5);

            assert.throws(() => {
                snmp.ObjectTypeUtil.castSetValue(snmp.ObjectType.Integer, 11, constraints);
            }, /Integer does not meet constraints/);
        });
    });

    describe('OctetString', function() {
        it('accepts strings', function() {
            assert.strictEqual(
                snmp.ObjectTypeUtil.castSetValue(snmp.ObjectType.OctetString, "test string"),
                "test string"
            );
        });

        it('converts buffers to strings', function() {
            const buf = Buffer.from("test buffer");
            assert.strictEqual(
                snmp.ObjectTypeUtil.castSetValue(snmp.ObjectType.OctetString, buf),
                buf.toString()
            );
        });

        it('throws on invalid types', function() {
            assert.throws(() => {
                snmp.ObjectTypeUtil.castSetValue(snmp.ObjectType.OctetString, 123);
            }, /Invalid OctetString/);
        });

        it('respects size constraints', function() {
            const constraints = {
                sizes: [
                    { min: 2, max: 5 }
                ]
            };

            assert.strictEqual(
                snmp.ObjectTypeUtil.castSetValue(snmp.ObjectType.OctetString, "123", constraints),
                "123"
            );

            assert.throws(() => {
                snmp.ObjectTypeUtil.castSetValue(snmp.ObjectType.OctetString, "too long", constraints);
            }, /OctetString does not meet constraints/);
        });
    });

    describe('OID', function() {
        it('accepts valid OIDs', function() {
            assert.strictEqual(
                snmp.ObjectTypeUtil.castSetValue(snmp.ObjectType.OID, "1.3.6.1.2.1"),
                "1.3.6.1.2.1"
            );
        });

        it('throws on invalid OIDs', function() {
            assert.throws(() => {
                snmp.ObjectTypeUtil.castSetValue(snmp.ObjectType.OID, "not.an.oid");
            }, /Invalid OID/);

            assert.throws(() => {
                snmp.ObjectTypeUtil.castSetValue(snmp.ObjectType.OID, "1.2.3.");
            }, /Invalid OID/);
        });
    });

    describe('Counter/Gauge/Unsigned32', function() {
        const types = [
            snmp.ObjectType.Counter,
            snmp.ObjectType.Counter32,
            snmp.ObjectType.Gauge,
            snmp.ObjectType.Gauge32,
            snmp.ObjectType.Unsigned32
        ];

        types.forEach(type => {
            it(`accepts valid unsigned integers for ${type}`, function() {
                assert.strictEqual(snmp.ObjectTypeUtil.castSetValue(type, 42), 42);
                assert.strictEqual(snmp.ObjectTypeUtil.castSetValue(type, "42"), 42);
            });

            it(`throws on negative numbers for ${type}`, function() {
                assert.throws(() => {
                    snmp.ObjectTypeUtil.castSetValue(type, -1);
                }, /Integer is negative/);
            });

            it(`throws on values exceeding unsigned 32-bit max for ${type}`, function() {
                assert.throws(() => {
                    snmp.ObjectTypeUtil.castSetValue(type, 4294967296); // MAX_UNSIGNED_INT32 + 1
                }, /Integer is greater than max unsigned int32/);
            });
        });
    });

    describe('Counter64', function() {
        it('accepts valid unsigned integers', function() {
            assert.strictEqual(snmp.ObjectTypeUtil.castSetValue(snmp.ObjectType.Counter64, 42), 42);
            assert.strictEqual(snmp.ObjectTypeUtil.castSetValue(snmp.ObjectType.Counter64, "42"), 42);
        });

        it('accepts valid 8-byte buffers', function() {
            const buf = Buffer.alloc(8);
            assert.strictEqual(
                snmp.ObjectTypeUtil.castSetValue(snmp.ObjectType.Counter64, buf),
                buf
            );
        });

        it('throws on invalid buffer length', function() {
            assert.throws(() => {
                snmp.ObjectTypeUtil.castSetValue(snmp.ObjectType.Counter64, Buffer.alloc(7));
            }, /Counter64 buffer is not 8 bytes/);
        });

        it('throws on negative numbers', function() {
            assert.throws(() => {
                snmp.ObjectTypeUtil.castSetValue(snmp.ObjectType.Counter64, -1);
            }, /Integer is negative for Counter64/);
        });
    });

    describe('IpAddress', function() {
        it('accepts valid IP addresses', function() {
            assert.strictEqual(
                snmp.ObjectTypeUtil.castSetValue(snmp.ObjectType.IpAddress, "192.168.1.1"),
                "192.168.1.1"
            );
        });

        it('throws on invalid IP addresses', function() {
            assert.throws(() => {
                snmp.ObjectTypeUtil.castSetValue(snmp.ObjectType.IpAddress, "not.an.ip.address");
            }, /Invalid IpAddress/);

            assert.throws(() => {
                snmp.ObjectTypeUtil.castSetValue(snmp.ObjectType.IpAddress, "192.168.1");
            }, /Invalid IpAddress/);
        });
    });
});
