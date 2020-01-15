
// Copyright 2013 Stephen Vickers

var snmp = require ("../");
var options = require("./option-parser");

var session = options.session;
var varbinds = options.varbinds;

session.set (varbinds, function (error, varbinds) {
	if (error) {
		console.error (error.toString ());
	} else {
		for (var i = 0; i < varbinds.length; i++)
			console.log (varbinds[i].oid + "|" + varbinds[i].value);
	}
});
