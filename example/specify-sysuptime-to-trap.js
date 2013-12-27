
// Copyright 2013 Stephen Vickers

var dns = require ("dns");
var os = require ("os");
var snmp = require ("../");

if (process.argv.length < 7) {
	console.log ("usage: node specify-sysuptime-to-trap <target> <community>\n"
			+ "          <version> <typeOrOid> <sysuptime>");
	process.exit (1);
}

var target = process.argv[2];
var community = process.argv[3];
var version = (process.argv[4] == "2c") ? snmp.Version2c : snmp.Version1;

var typeOrOid = process.argv[5];

var upTime = parseInt(process.argv[6]);

var session = snmp.createSession (target, community, {version: version});

dns.lookup (os.hostname (), function (error, address) {
	if (error) {
		console.trace (error);
	} else {
		// address will be ignored for version 2c
		session.trap (snmp.TrapType[typeOrOid] || parseInt(typeOrOid),
				{upTime: upTime}, function (error) {
			if (error)
				console.trace ("Trap failed: " + error);
		});
	}
});
