
// Copyright 2013 Stephen Vickers

var snmp = require ("node-snmp-client");

if (process.argv.length < 5) {
	console.log ("usage: snmp-walk <target> <community> <oid>");
	process.exit (1);
}

var target = process.argv[2];
var community = process.argv[3];

var oids = [process.argv[4]];

var session = snmp.createSession (target, community);

function cb (error, varbinds) {
	if (error) {
		if (error instanceof snmp.RequestFailedError) {
			if (error.status != snmp.ErrorStatus.NoSuchName) {
				console.error (error.toString ());
			}
		} else {
			console.error (error.toString ());
		}
	} else {
		var oids = [];
		for (var i = 0; i < varbinds.length; i++) {
			console.log (varbinds[i].oid + "|" + varbinds[i].type + "|"
					+ varbinds[i].value);
			oids.push (varbinds[i].oid);
		}
		getNext (oids, cb);
	}
}

function getNext (oids, cb) {
	session.getNext (oids, cb);
}

getNext (oids, cb);
