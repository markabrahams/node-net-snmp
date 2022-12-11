var snmp = require ("../");
var getopts = require ("getopts");

var options = getopts(process.argv.slice(2));
var verbose = options.v;
var snmpOptions = {
    disableAuthorization: options.n,
    port: options.p,
	transport: options.t,
    engineID: options.e,
    includeAuthentication: options.a
};

var cb = function(error, trap) {
    var now = new Date().toLocaleString();
    var trapType;
    if (error) {
        console.log (now + ": " + error.message);
        console.error (error);
    } else {
        trapType = snmp.PduType[trap.pdu.type] || "Unknown";
        if ( verbose ) {
            console.log (now + ": " + trapType + " received:");
            console.log (JSON.stringify(trap, null, 2));
        } else {
            if (trap.pdu.type == snmp.PduType.Trap ) {
                console.log (now + ": " + trapType + ": " + trap.rinfo.address + " : " + trap.pdu.enterprise);
			} else {
				for (var i = 0; i < trap.pdu.varbinds.length; i++) {
                    console.log (now + ": " + trapType + ": " + trap.rinfo.address + " : " + trap.pdu.varbinds[i].oid + " -> " + trap.pdu.varbinds[i].value);
				}
            }
        }
    }
};

var receiver = snmp.createReceiver(snmpOptions, cb);
var authorizer = receiver.getAuthorizer ();
authorizer.addCommunity ("public");
authorizer.addUser ({
    name: "fred",
    level: snmp.SecurityLevel.noAuthNoPriv
});
authorizer.addUser ({
    name: "betty",
    level: snmp.SecurityLevel.authNoPriv,
    authProtocol: snmp.AuthProtocols.sha,
    authKey: "illhavesomeauth"
});
authorizer.addUser ({
    name: "wilma",
    level: snmp.SecurityLevel.authPriv,
    authProtocol: snmp.AuthProtocols.sha,
    authKey: "illhavesomeauth",
    privProtocol: snmp.PrivProtocols.des,
    privKey: "andsomepriv"
});
authorizer.addUser ({
    name: "barney",
    level: snmp.SecurityLevel.authPriv,
    authProtocol: snmp.AuthProtocols.sha,
    authKey: "illhavesomeauth",
    privProtocol: snmp.PrivProtocols.aes,
    privKey: "andsomepriv"
});
