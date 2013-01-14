
// Copyright 2013 Stephen Vickers

var snmp = require ("node-snmp-client");

if (process.argv.length < 5) {
	console.log ("usage: snmp-get-next <target> <community> <oid>");
	process.exit (1);
}

var target = process.argv[2];
var community = process.argv[3];

var oids = [process.argv[4]];

var session = snmp.createSession (target, community);

session.get (oids, function (error, varbinds) {
	if (error) {
		console.error (error.toString ());
	} else {
		for (var i = 0; i < varbinds.length; i++)
			console.log (varbinds[i].oid + "|" + varbinds[i].value);
	}
});
