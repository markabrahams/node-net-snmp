
// Copyright 2013 Stephen Vickers

var snmp = require ("../");

if (process.argv.length < 7) {
	console.log ("usage: snmp-set <target> <community> <oid> <type> <value>");
	process.exit (1);
}

var target = process.argv[2];
var community = process.argv[3];

var varbinds = [{
	oid: process.argv[4],
	type: snmp.ObjectType[process.argv[5]],
	value: process.argv[6]
}];

var hostname = "hostname-" + new Date ().getTime ().toString ();

var session = snmp.createSession (target, community);

session.set (varbinds, function (error, varbinds) {
	if (error) {
		console.error (error.toString ());
	} else {
		for (var i = 0; i < varbinds.length; i++)
			console.log (varbinds[i].oid + "|" + varbinds[i].value);
	}
});
