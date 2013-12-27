
// Copyright 2013 Stephen Vickers

var snmp = require ("../");

if (process.argv.length < 6) {
	console.log ("usage: specify-sysuptime-to-inform <target> <community> <oid> <sysuptime>");
	process.exit (1);
}

var target = process.argv[2];
var community = process.argv[3];

var typeOrOid = process.argv[4];

var upTime = parseInt(process.argv[5]);

var options = {version: snmp.Version2c};

var session = snmp.createSession (target, community, options);

session.inform (snmp.TrapType[typeOrOid] || typeOrOid, {upTime: upTime},
		function (error, varbinds) {
	if (error) {
		console.error (error.toString ());
	} else {
		for (var i = 0; i < varbinds.length; i++) {
			if (snmp.isVarbindError (varbinds[i]))
				console.error (snmp.varbindError (varbinds[i]));
			else
				console.log (varbinds[i].oid + "|" + varbinds[i].value);
		}
	}
});
