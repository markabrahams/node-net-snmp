
// Copyright 2013 Stephen Vickers

var snmp = require ("../");

if (process.argv.length < 6) {
	console.log ("usage: snmp-walk <target> <community> <version> <oid>");
	process.exit (1);
}

var target = process.argv[2];
var community = process.argv[3];
var version = (process.argv[4] == "2c") ? snmp.Version2c : snmp.Version1;

var oids = [process.argv[5]];

var session = snmp.createSession (target, community, {version: version});

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
		if (version == snmp.Version2c) {
			for (var i = 0; i < varbinds.length; i++) {
				for (var j = 0; j < varbinds[i].length; j++) {
					if (! snmp.isVarbindError (varbinds[i][j])) {
						console.log (varbinds[i][j].oid + "|" + varbinds[i][j].type + "|"
								+ varbinds[i][j].value);
					}
				}
				if (! snmp.isVarbindError (varbinds[i][varbinds[i].length - 1]))
					oids.push (varbinds[i][varbinds[i].length - 1].oid);
			}
		} else {
			for (var i = 0; i < varbinds.length; i++) {
				console.log (varbinds[i].oid + "|" + varbinds[i].type + "|"
						+ varbinds[i].value);
				oids.push (varbinds[i].oid);
			}
		}
		if (oids.length)
			walk (oids, cb);
	}
}

function walk (oids, cb) {
	if (version == snmp.Version2c)
		session.getBulk (oids, 0, 20, cb);
	else
		session.getNext (oids, cb);
}

walk (oids, cb);
