
// Copyright 2013 Stephen Vickers

var dns = require ("dns");
var os = require ("os");
var snmp = require ("../");

if (process.argv.length < 5) {
	console.log ("usage: node snmp-get <target> <community> <typeOrOid>");
	process.exit (1);
}

var target = process.argv[2];
var community = process.argv[3];
var typeOrOid = process.argv[4];

var hostname = "hostname-" + new Date ().getTime ().toString ();

var session = snmp.createSession (target, community);

dns.lookup (os.hostname (), function (error, address) {
	if (error) {
		console.trace (error);
	} else {
		session.trap (snmp.TrapType[typeOrOid] || typeOrOid,
				address, function (error) {
			if (error)
				console.trace ("Trap failed: " + error);
		});
	}
});
