
// Copyright 2013 Stephen Vickers

var snmp = require ("../");

if (process.argv.length < 8) {
	console.log ("usage: snmp-set <target> <community> <version> <oid> <type> "
			+ "<value>");
	process.exit (1);
}

var target = process.argv[2];
var community = process.argv[3];
var version = (process.argv[4] == "2c") ? snmp.Version2c : snmp.Version1;

var varbinds = [{
	oid: process.argv[5],
	type: snmp.ObjectType[process.argv[6]],
	value: process.argv[7]
}];

var session = snmp.createSession (target, community, {version: version});

session.set (varbinds, function (error, varbinds) {
	if (error) {
		console.error (error.toString ());
	} else {
		for (var i = 0; i < varbinds.length; i++)
			console.log (varbinds[i].oid + "|" + varbinds[i].value);
	}
});
