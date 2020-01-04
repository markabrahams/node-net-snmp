
// Copyright 2013 Stephen Vickers

var snmp = require ("../");
var options = require("./option-parser");

var session = options.session;
var oid = options.oids[0];
var maxRepetitions = options.maxRepetitions || 20;

function doneCb (error) {
	if (error)
		console.error (error.toString ());
}

function feedCb (varbinds) {
	for (var i = 0; i < varbinds.length; i++) {
		if (snmp.isVarbindError (varbinds[i]))
			console.error (snmp.varbindError (varbinds[i]));
		else
			console.log (varbinds[i].oid + "|" + varbinds[i].value);
	}
}

session.subtree (oid, maxRepetitions, feedCb, doneCb);
