
// Copyright 2013 Stephen Vickers

var dns = require ("dns");
var os = require ("os");
var snmp = require ("../");
var options = require("./option-parser");

var session = options.session;
var typeOrOid = options.oids[0];

dns.lookup (os.hostname (), function (error, address) {
	if (error) {
		console.trace (error);
	} else {
		// address will be ignored for version 2c
		session.trap (snmp.TrapType[typeOrOid] || typeOrOid,
				address, function (error) {
			if (error)
				console.trace ("Trap failed: " + error);
		});
	}
});
