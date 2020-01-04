
// Copyright 2013 Stephen Vickers

var snmp = require ("../");
var options = require("./option-parser");

var session = options.session;
var oids = options.oids;

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
