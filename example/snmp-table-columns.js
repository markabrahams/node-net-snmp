
// Copyright 2013 Stephen Vickers

var snmp = require ("../");

if (process.argv.length < 7) {
	console.log ("usage: snmp-table-columns <target> <community> <version> "
			+ "<oid> <col> [<col> ...]");
	process.exit (1);
}

var target = process.argv[2];
var community = process.argv[3];
var version = (process.argv[4] == "2c") ? snmp.Version2c : snmp.Version1;

var oid = process.argv[5];
var columns = [];

for (var i = 6; i < process.argv.length; i++)
	columns.push (process.argv[i]);

var session = snmp.createSession (target, community, {version: version});

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
		for (index in table)
			indexes.push (index);
		indexes.sort ();

		for (var i = 0; i < indexes.length; i++) {
			var columns = [];
			for (column in table[indexes[i]])
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

var maxRepetitions = 20;

// The maxRepetitions argument is optional, and will be ignored unless using
// SNMP verison 2c
session.tableColumns (oid, columns, maxRepetitions, responseCb);
