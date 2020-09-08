
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
		for (var j = nonRepeaters; j < varbinds.length; j++) {
			for (var k = 0; k < varbinds[j].length; k++) {
				if (snmp.isVarbindError (varbinds[j][k]))
					console.error (snmp.varbindError (varbinds[j][k]));
				else
					console.log (varbinds[j][k].oid + "|" + varbinds[j][k].value);
			}
		}
	}
});
