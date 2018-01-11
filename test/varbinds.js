
var ber    = require ('asn1-ber').Ber;
var assert = require('assert');
var snmp   = require('../');

describe('parseInt()', function() {
	describe('given a negative integer', function() {
		var writer = new ber.Writer();
		writer.writeInt(-3);
		var reader = new ber.Reader(writer.buffer);
		it('returns a negative integer', function() {
			assert.equal(-3, snmp.ObjectParser.readInt(reader));
		})
	}),
	describe('given a positive integer', function() {
		var writer = new ber.Writer();
		writer.writeInt(3245689);
		var reader = new ber.Reader(writer.buffer);
		it('returns a positive integer', function() {
			assert.equal(3245689, snmp.ObjectParser.readInt(reader));
		})
	})
});

describe('parseUint()', function() {
	describe('given a positive integer', function() {
		var writer = new ber.Writer();
		writer.writeInt(3242425);
		var reader = new ber.Reader(writer.buffer);
		it('returns a positive integer', function() {
			assert.equal(3242425, snmp.ObjectParser.readUint(reader));
		})
	}),
	describe('given a negative integer', function() {
		var writer = new ber.Writer();
		writer.writeInt(-3);
		var reader = new ber.Reader(writer.buffer);
		it('returns a positive integer', function() {
			assert.equal(253, snmp.ObjectParser.readUint(reader));
		})
	})
});
