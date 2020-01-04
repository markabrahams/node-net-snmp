
// Copyright 2013 Stephen Vickers

var snmp = require ("../");
var options = require("./option-parser");

var session = options.session;
var oid = options.oids[0];

function poll () {
	session.get ([oid], function (error, varbinds) {
		if (error) {
			console.error (error.toString ());
		} else {
			if (snmp.isVarbindError (varbinds[0]))
				console.error (snmp.varbindError (varbinds[0]));
			else
				console.log (varbinds[0].value);
		}
	});
}

poll ();

setInterval (poll, 1000);
