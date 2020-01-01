
// Copyright 2013 Stephen Vickers

var snmp = require ("../");

if (process.argv.length < 6) {
	console.log ("usage: snmp-get <target> <oid>");
	process.exit (1);
}

var target = process.argv[2];
var user = {
	name: "noauth",
	level: snmp.UsmLevel.noAuthNoPriv
	// authProtocol: snmp.AuthProtocol.MD5,
	// authKey: "",
	// privProtocol: snmp.PrivProtocol.DES,
	// privKey: ""
}

var oids = [process.argv[3]];

var session = snmp.createV3Session (target, user, {version: snmp.Version3});

session.get (oids, function (error, varbinds) {
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
