const assert = require('assert');
const snmp = require('..');

describe('Object Types', function() {

	describe('isValid() - Boolean', function() {
		describe('JS true is a Boolean type', function() {
			it('returns true', function() {
				assert.equal(snmp.ObjectTypeUtil.isValid(snmp.ObjectType.Boolean, true), true);
			});
		});
		describe('JS false is a Boolean type', function() {
			it('returns true', function() {
				assert.equal(snmp.ObjectTypeUtil.isValid(snmp.ObjectType.Boolean, false), true);
			});
		});
	});

	describe('isValid() - Integer', function() {
		describe('Zero is an Integer type', function() {
			it('returns true', function() {
				assert.equal(snmp.ObjectTypeUtil.isValid(snmp.ObjectType.Integer, 0), true);
			});
		});
		describe('An positive integer number is an Integer type', function() {
			it('returns true', function() {
				assert.equal(snmp.ObjectTypeUtil.isValid(snmp.ObjectType.Integer, 44), true);
			});
		});
		describe('An positive integer string is an Integer type', function() {
			it('returns true', function() {
				assert.equal(snmp.ObjectTypeUtil.isValid(snmp.ObjectType.Integer, "44"), true);
			});
		});
		describe('An negative integer number is an Integer type', function() {
			it('returns true', function() {
				assert.equal(snmp.ObjectTypeUtil.isValid(snmp.ObjectType.Integer, -24), true);
			});
		});
		describe('A negative integer string is an Integer type', function() {
			it('returns true', function() {
				assert.equal(snmp.ObjectTypeUtil.isValid(snmp.ObjectType.Integer, "-24"), true);
			});
		});
		describe('A non-integer decimal number is not an Integer type', function() {
			it('returns false', function() {
				assert.equal(snmp.ObjectTypeUtil.isValid(snmp.ObjectType.Integer, 45.2), false);
			});
		});
		describe('A non-integer decimal string is not an Integer type', function() {
			it('returns false', function() {
				assert.equal(snmp.ObjectTypeUtil.isValid(snmp.ObjectType.Integer, "45.2"), false);
			});
		});
		describe('An integer at the bottom of the valid range is an Integer type', function() {
			it('returns true', function() {
				assert.equal(snmp.ObjectTypeUtil.isValid(snmp.ObjectType.Integer, -2147483648), true);
			});
		});
		describe('An integer just lower than the valid range is not an Integer type', function() {
			it('returns false', function() {
				assert.equal(snmp.ObjectTypeUtil.isValid(snmp.ObjectType.Integer, -2147483649), false);
			});
		});
		describe('An integer at the top of the valid range is an Integer type', function() {
			it('returns true', function() {
				assert.equal(snmp.ObjectTypeUtil.isValid(snmp.ObjectType.Integer, 2147483647), true);
			});
		});
		describe('An integer just higher than the valid range is not an Integer type', function() {
			it('returns false', function() {
				assert.equal(snmp.ObjectTypeUtil.isValid(snmp.ObjectType.Integer, 2147483648), false);
			});
		});
		// Tests for constraints
		describe('An integer at the bottom of the valid range is a valid Integer type', function() {
			it('returns true', function() {
				assert.equal(snmp.ObjectTypeUtil.isValid(snmp.ObjectType.Integer, 0, { ranges: [{ min: 0, max: 10 }] }), true);
			});
		});
		describe('An integer outside the valid range is not an valid Integer type', function() {
			it('returns false', function() {
				assert.equal(snmp.ObjectTypeUtil.isValid(snmp.ObjectType.Integer, 11, { ranges: [{ min: 0, max: 10 }] }), false);
			});
		});
	});

	describe('isValid() - OctetString', function() {
		describe('A string is an OctetString type', function() {
			it('returns true', function() {
				assert.equal(snmp.ObjectTypeUtil.isValid(snmp.ObjectType.OctetString, 'Better late than never'), true);
			});
		});
		describe('A buffer is an OctetString type', function() {
			it('returns true', function() {
				assert.equal(snmp.ObjectTypeUtil.isValid(snmp.ObjectType.OctetString, Buffer.from('1.3.6.1.2.3.4.5')), true);
			});
		});
		describe('A string with a length of 6 is valid for a size range of 2 - 7', function() {
			it('returns true', function() {
				const sizes = [
					{ min: 2, max: 7 },
				];
				assert.equal(snmp.ObjectTypeUtil.isValid(snmp.ObjectType.OctetString, 'sixlet', { sizes }), true);
			});
		});
		describe('A string with a length of 6 is not valid for a size range of 2 - 5', function() {
			it('returns true', function() {
				const sizes = [
					{ min: 2, max: 5 },
				];
				assert.equal(snmp.ObjectTypeUtil.isValid(snmp.ObjectType.OctetString, 'sixlet', { sizes }), false);
			});
		});
	});

	describe('isValid() - OID', function() {
		describe('A string OID is an OID type', function() {
			it('returns true', function() {
				assert.equal(snmp.ObjectTypeUtil.isValid(snmp.ObjectType.OctetString, '1.3.6.1.2.33.4.5'), true);
			});
		});
		describe('A string non-OID is not an OID type', function() {
			it('returns true', function() {
				assert.equal(snmp.ObjectTypeUtil.isValid(snmp.ObjectType.OctetString, 'dog'), true);
			});
		});
		describe('An OID string with a double-dot is not an OID type', function() {
			it('returns true', function() {
				assert.equal(snmp.ObjectTypeUtil.isValid(snmp.ObjectType.OctetString, '1.3.6.1..2.33.4.5'), true);
			});
		});
		describe('An OID string with a leading dot is not an OID type', function() {
			it('returns true', function() {
				assert.equal(snmp.ObjectTypeUtil.isValid(snmp.ObjectType.OctetString, '.1.3.6.1..2.33.4.5'), true);
			});
		});
		describe('An OID string with a trailing dot is not an OID type', function() {
			it('returns true', function() {
				assert.equal(snmp.ObjectTypeUtil.isValid(snmp.ObjectType.OctetString, '1.3.6.1.2.33.4.5.'), true);
			});
		});
	});

	describe('isValid() - Counter', function() {
		describe('Zero is a Counter type', function() {
			it('returns true', function() {
				assert.equal(snmp.ObjectTypeUtil.isValid(snmp.ObjectType.Counter, 0), true);
			});
		});
		describe('An positive integer number is a Counter type', function() {
			it('returns true', function() {
				assert.equal(snmp.ObjectTypeUtil.isValid(snmp.ObjectType.Counter, 44), true);
			});
		});
		describe('An positive integer string is a Counter type', function() {
			it('returns true', function() {
				assert.equal(snmp.ObjectTypeUtil.isValid(snmp.ObjectType.Counter, "44"), true);
			});
		});
		describe('An negative integer number is not a Counter type', function() {
			it('returns false', function() {
				assert.equal(snmp.ObjectTypeUtil.isValid(snmp.ObjectType.Counter, -24), false);
			});
		});
		describe('A negative integer string is not a Counter type', function() {
			it('returns false', function() {
				assert.equal(snmp.ObjectTypeUtil.isValid(snmp.ObjectType.Counter, "-24"), false);
			});
		});
		describe('A non-integer decimal number is not a Counter type', function() {
			it('returns false', function() {
				assert.equal(snmp.ObjectTypeUtil.isValid(snmp.ObjectType.Counter, 45.2), false);
			});
		});
		describe('A non-integer decimal string is not a Counter type', function() {
			it('returns false', function() {
				assert.equal(snmp.ObjectTypeUtil.isValid(snmp.ObjectType.Counter, "45.2"), false);
			});
		});
		describe('An integer at the bottom of the valid range is a Counter type', function() {
			it('returns true', function() {
				assert.equal(snmp.ObjectTypeUtil.isValid(snmp.ObjectType.Counter, 0), true);
			});
		});
		describe('An integer just lower than the valid range is not a Counter type', function() {
			it('returns false', function() {
				assert.equal(snmp.ObjectTypeUtil.isValid(snmp.ObjectType.Counter, -1), false);
			});
		});
		describe('An integer at the top of the valid range is a Counter type', function() {
			it('returns true', function() {
				assert.equal(snmp.ObjectTypeUtil.isValid(snmp.ObjectType.Counter, 4294967295), true);
			});
		});
		describe('An integer just higher than the valid range is not a Counter type', function() {
			it('returns false', function() {
				assert.equal(snmp.ObjectTypeUtil.isValid(snmp.ObjectType.Counter, 4294967296), false);
			});
		});
	});

	describe('isValid() - Counter64', function() {
		describe('Zero is a Counter64 type', function() {
			it('returns true', function() {
				assert.equal(snmp.ObjectTypeUtil.isValid(snmp.ObjectType.Counter64, 0), true);
			});
		});
		describe('An positive integer number is a Counter64 type', function() {
			it('returns true', function() {
				assert.equal(snmp.ObjectTypeUtil.isValid(snmp.ObjectType.Counter64, 44), true);
			});
		});
		describe('An positive integer string is a Counter64 type', function() {
			it('returns true', function() {
				assert.equal(snmp.ObjectTypeUtil.isValid(snmp.ObjectType.Counter64, "44"), true);
			});
		});
		describe('An negative integer number is not a Counter64 type', function() {
			it('returns false', function() {
				assert.equal(snmp.ObjectTypeUtil.isValid(snmp.ObjectType.Counter64, -24), false);
			});
		});
		describe('A negative integer string is not a Counter64 type', function() {
			it('returns false', function() {
				assert.equal(snmp.ObjectTypeUtil.isValid(snmp.ObjectType.Counter64, "-24"), false);
			});
		});
		describe('A non-integer decimal number is not a Counter64 type', function() {
			it('returns false', function() {
				assert.equal(snmp.ObjectTypeUtil.isValid(snmp.ObjectType.Counter64, 45.2), false);
			});
		});
		describe('A non-integer decimal string is not a Counter64 type', function() {
			it('returns false', function() {
				assert.equal(snmp.ObjectTypeUtil.isValid(snmp.ObjectType.Counter64, "45.2"), false);
			});
		});
		describe('An integer at the bottom of the valid range is a Counter64 type', function() {
			it('returns true', function() {
				assert.equal(snmp.ObjectTypeUtil.isValid(snmp.ObjectType.Counter64, 0), true);
			});
		});
		describe('An integer just lower than the valid range is not a Counter64 type', function() {
			it('returns false', function() {
				assert.equal(snmp.ObjectTypeUtil.isValid(snmp.ObjectType.Counter64, -1), false);
			});
		});
	});

	describe('isValid() - IPAddress', function() {
		describe('Dotted quad of numbers is an IpAddress type', function() {
			it('returns true', function() {
				assert.equal(snmp.ObjectTypeUtil.isValid(snmp.ObjectType.IpAddress, '10.3.147.4'), true);
			});
		});
		describe('Dotted quin of numbers is not an IpAddress type', function() {
			it('returns false', function() {
				assert.equal(snmp.ObjectTypeUtil.isValid(snmp.ObjectType.IpAddress, '10.3.147.22.4'), false);
			});
		});
		describe('Dotted quad containing non-numbers is not an IpAddress type', function() {
			it('returns false', function() {
				assert.equal(snmp.ObjectTypeUtil.isValid(snmp.ObjectType.IpAddress, '10.word.147.4'), false);
			});
		});
	});

});
