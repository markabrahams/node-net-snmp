
// Copyright 2013 Stephen Vickers

var snmp = require ("../");
var options = require("./option-parser");

var session = options.session;
var oids = options.oids;
var nonRepeaters = options.nonRepeaters || 0;
var maxRepetitions = options.maxRepetitions || 20;

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
