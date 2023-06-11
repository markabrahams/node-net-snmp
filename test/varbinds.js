const ber    = require ('asn1-ber').Ber;
const assert = require('assert');
const snmp   = require('../');

describe('parseInt()', function() {
	describe('given a negative integer', function() {
		const writer = new ber.Writer();
		writer.writeInt(-3);
		const reader = new ber.Reader(writer.buffer);
		it('returns a negative integer', function() {
			assert.equal(snmp.ObjectParser.readInt32(reader), -3);
		});
	});
	describe('given a positive integer', function() {
		const writer = new ber.Writer();
		writer.writeInt(3245689);
		const reader = new ber.Reader(writer.buffer);
		it('returns a positive integer', function() {
			assert.equal(snmp.ObjectParser.readInt32(reader), 3245689);
		});
	});
});

describe('parseUint()', function() {
	describe('given a positive integer', function() {
		const writer = new ber.Writer();
		writer.writeInt(3242425);
		const reader = new ber.Reader(writer.buffer);
		it('returns a positive integer', function() {
			assert.equal(snmp.ObjectParser.readUint32(reader), 3242425);
		});
	});
	describe('given a negative integer', function() {
		const writer = new ber.Writer();
		writer.writeInt(-3);
		const reader = new ber.Reader(writer.buffer);
		it('returns a positive integer', function() {
			assert.equal(snmp.ObjectParser.readUint32(reader), 4294967293);
		});
	});
	describe('given a large integer', function() {
		const writer = new ber.Writer();
		writer.writeInt(4294967294);
		const reader = new ber.Reader(writer.buffer);
		it('returns a positive integer', function() {
			assert.equal(snmp.ObjectParser.readUint32(reader), 4294967294);
		});
	});
});
