
// Copyright 2013 Stephen Vickers

var options = require("./option-parser");

var session = options.session;
var oid = options.oids[0];
var maxRepetitions = options.maxRepetitions || 20;

function sortInt (a, b) {
	if (a > b)
		return 1;
	else if (b > a)
		return -1;
	else
		return 0;
}

function responseCb (error, table) {
	if (error) {
		console.error (error.toString ());
	} else {
		var indexes = [];
		for (var index in table)
			indexes.push (index);
		indexes.sort ();

		for (var i = 0; i < indexes.length; i++) {
			var columns = [];
			for (var column in table[indexes[i]])
				columns.push (parseInt (column));
			columns.sort (sortInt);

			console.log ("row for index = " + indexes[i]);
			for (var j = 0; j < columns.length; j++) {
				console.log ("   column " + columns[j] + " = "
						+ table[indexes[i]][columns[j]]);
			}
		}
	}
}

session.table (oid, maxRepetitions, responseCb);
