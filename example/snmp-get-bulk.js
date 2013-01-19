
// Copyright 2013 Stephen Vickers

var snmp = require ("../");

if (process.argv.length < 8) {
	console.log ("usage: snmp-get-next <target> <community> <version> "
			+ "<non-rpts> <max-reps> <oids>");
	process.exit (1);
}

var target = process.argv[2];
var community = process.argv[3];
var version = (process.argv[4] == "2c") ? snmp.Version2c : snmp.Version1;

var nonRepeaters = parseInt (process.argv[5])
var maxRepetitions = parseInt (process.argv[6]);

var oids = [];

for (var i = 7; i < process.argv.length; i++)
	oids.push (process.argv[i]);

var session = snmp.createSession (target, community, {version: version});

session.getBulk (oids, nonRepeaters, maxRepetitions, function (error,
		varbinds) {
	if (error) {
		console.error (error.toString ());
	} else {
		// step through the non-repeaters which are single varbinds
		for (var i = 0; i < nonRepeaters; i++) {
			if (i >= varbinds.length)
				break;
			
			if (snmp.isVarbindError (varbinds[i]))
				console.error (snmp.varbindError (varbinds[i]));
			else
				console.log (varbinds[i].oid + "|" + varbinds[i].value);
		}
		
		// then step through the repeaters which are varbind arrays
		for (var i = nonRepeaters; i < varbinds.length; i++) {
			for (var j = 0; j < varbinds[i].length; j++) {
				if (snmp.isVarbindError (varbinds[i][j]))
					console.error (snmp.varbindError (varbinds[i][j]));
				else
					console.log (varbinds[i][j].oid + "|" + varbinds[i][j].value);
			}
		}
	}
});
