
// Copyright 2013 Stephen Vickers

var snmp = require ("../");

if (process.argv.length < 8) {
	console.log ("usage: specify-source-address-and-port <source-address> "
			+ "<source-port>\n      	    <target> <community> <version> "
			+ "<oid>");
	process.exit (1);
}

var sourceAddress = process.argv[2];
var sourcePort = process.argv[3];

var target = process.argv[4];
var community = process.argv[5];
var version = (process.argv[6] == "2c") ? snmp.Version2c : snmp.Version1;

var oids = [process.argv[7]];

var sessionOptions = {
	version: version,
	sourceAddress: sourceAddress,
	sourcePort: sourcePort
};

var session = snmp.createSession (target, community, sessionOptions);

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
