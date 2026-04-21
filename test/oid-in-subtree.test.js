const assert = require('assert');
const snmp = require('..');

const oidInSubtree = snmp.OidUtil.oidInSubtree;

describe('oidInSubtree()', function () {

	it('returns true when nextString is in the subtree', function () {
		assert.strictEqual(oidInSubtree('1.3.6.1.2.1', '1.3.6.1.2.1.1.1.0'), true);
	});

	it('returns true when oidString equals nextString', function () {
		assert.strictEqual(oidInSubtree('1.3.6.1.2.1', '1.3.6.1.2.1'), true);
	});

	it('returns false when nextString is outside the subtree', function () {
		assert.strictEqual(oidInSubtree('1.3.6.1.2.1', '1.3.6.1.4.1.9'), false);
	});

	it('returns false when nextString is shorter than oidString', function () {
		assert.strictEqual(oidInSubtree('1.3.6.1.2.1', '1.3.6.1'), false);
	});

	it('returns false when nextString is null (issue #298)', function () {
		assert.strictEqual(oidInSubtree('1.3.6.1.2.1', null), false);
	});

	it('returns false when nextString is undefined', function () {
		assert.strictEqual(oidInSubtree('1.3.6.1.2.1', undefined), false);
	});

	it('returns false when nextString is an empty string', function () {
		assert.strictEqual(oidInSubtree('1.3.6.1.2.1', ''), false);
	});

});
