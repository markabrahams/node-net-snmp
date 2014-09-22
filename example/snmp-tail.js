
// Copyright 2013 Stephen Vickers

var snmp = require ("../");

if (process.argv.length < 6) {
	console.log ("usage: snmp-tail <target> <community> <version> <oid>");
	process.exit (1);
}

var target = process.argv[2];
var community = process.argv[3];
var version = (process.argv[4] == "2c") ? snmp.Version2c : snmp.Version1;

var oid = process.argv[5];

var session = snmp.createSession (target, community, {version: version});

function poll () {
	session.get ([oid], function (error, varbinds) {
		if (error) {
			console.error (error.toString ());
		} else {
			if (snmp.isVarbindError (varbinds[0]))
				console.error (snmp.varbindError (varbinds[0]));
			else
				console.log (varbinds[0].value);
		}
	});
}

poll ();

setInterval (poll, 1000);
