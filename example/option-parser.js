var snmp = require ("../");
var getopts = require ("getopts");

var options = getopts(process.argv.slice(2), {
    string: ["e"]
});
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
snmpOptions.debug = options.d;
snmpOptions.transport = options.t;
if ( snmpOptions.version == snmp.Version3 ) {
    if ( options.e ) {
        snmpOptions.engineID = options.e.toString();
    }
	user = {
		name: options.u,
		level: snmp.SecurityLevel[options.l]
    };
    if ( options.a ) {
        user.authProtocol = snmp.AuthProtocols[options.a.toLowerCase()];
        user.authKey = options.A;
    }
    if ( options.x ) {
		user.privProtocol = snmp.PrivProtocols[options.x.toLowerCase()];
        user.privKey = options.X;
    }
    snmpOptions.context = options.n;
} else {
	community = options.c;
}

nonRepeaters = options.o;
maxRepetitions = options.r;

if (options._.length < 2) {
	console.log ("usage: " + process.argv[1] + " [<options>] <target> <oid>");
	process.exit (1);
}

var target = options._[0];

var command = process.argv[1].split('/').slice(-1)[0];
if ( command.includes('snmp-set') ) {
    varbinds = [{
        oid: options._[1],
        type: snmp.ObjectType[options._[2]],
        value: options._[3]
    }];
} else if ( command.includes('snmp-table-columns') ) {
    oids = [options._[1]];
    columns = [];
    for (var i = 1; i < options._.length; i++) {
        columns.push (options._[i]);
    }
} else {
    oids = [];
    for (var j = 1; j < options._.length; j++) {
        oids.push (options._[j]);
    }
}
if ( command.includes('snmp-trap') || command.includes('snmp-inform') || command.includes('snmp-receiver') ) {
    snmpOptions.trapPort = options.p;
} else {
    snmpOptions.port = options.p;
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
