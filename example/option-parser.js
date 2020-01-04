var snmp = require ("../");
var getopts = require ("getopts");

var options = getopts(process.argv.slice(2));
var community;
var user;
var session;
var nonRepeaters;
var maxRepetitions;
var oids;
var varbinds;
var columns;
var snmpOptions = {};

if ( ! options.v ) {
	options.v = snmp.Version1;
}

snmpOptions.version = snmp.Version[options.v];
if ( snmpOptions.version == snmp.Version3 ) {
    var engineID;
    if ( options.e ) {
        engineID = Buffer.from((options.e.toString().length % 2 == 1 ? '0' : '') + options.e.toString(), 'hex');
    }
	user = {
		name: options.u,
		level: snmp.UsmLevel[options.l],
		authProtocol: snmp.UsmAuthProtocol[options.a],
		authKey: options.A,
		privProtocol: snmp.UsmPrivProtocol[options.x],
        privKey: options.X,
        engineID: engineID
	};
} else {
	community = options.c;
}

nonRepeaters = options.n;
maxRepetitions = options.r;

if (options._.length < 2) {
	console.log ("usage: " + process.argv[1] + "<target> <oid>");
	process.exit (1);
}

var target = options._[0];

var command = process.argv[1].split('/').slice(-1)[0];
if ( command.includes('set') ) {
    varbinds = [{
        oid: options._[1],
        type: snmp.ObjectType[options._[2]],
        value: options._[3]
    }];
} else if ( command.includes('columns') ) {
    oids = [options._[1]];
    columns = [];
    for (var i = 1; i < options._.length; i++) {
        columns.push (options._[i]);
    }
} else {
    oids = [];
    for (var i = 1; i < options._.length; i++) {
        oids.push (options._[i]);
    }
}

if ( snmpOptions.version == snmp.Version3 ) {
	session = snmp.createV3Session (target, user, snmpOptions);
} else {
	session = snmp.createSession (target, community, snmpOptions);
}

exports.session = session;
exports.oids = oids;
exports.varbinds = varbinds;
exports.nonRepeaters = nonRepeaters;
exports.maxRepetitions = maxRepetitions;
exports.columns = columns;