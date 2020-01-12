
// Copyright 2013 Stephen Vickers

var snmp = require ("../");
var getopts = require ("getopts");

var options = getopts(process.argv.slice(2));

var verbose = options.v;

var cb = function(error, trap) {
    var now = new Date().toLocaleString();
    var trapType;
    if (error) {
        console.log(now + ": " + error.message);
    } else {
        trapType = snmp.PduType[trap.pdu.type] || "Unknown";
        if ( verbose ) {
            console.log (now + ": " + trapType + " received:");
            console.log (JSON.stringify(trap, null, 2));
        } else {
            if (trap.pdu.type == 164 ) {
                console.log (now + ": " + trapType + ": " + trap.rinfo.address + " : " + trap.pdu.enterprise);
            } else {
                console.log (now + ": " + trapType + ": " + trap.rinfo.address + " : " + trap.pdu.varbinds[1].value);
            }
        }
    }
}

var snmpOptions = {
    disableAuthorization: options.n,
    trapPort: options.p,
    engineID: options.e
};

var receiver = snmp.createReceiver(snmpOptions, cb);
receiver.addUser ({
    name: "none",
    level: snmp.SecurityLevel.noAuthNoPriv
});
receiver.addUser ({
    name: "md5only",
    level: snmp.SecurityLevel.authNoPriv,
    authProtocol: snmp.AuthProtocols.md5,
    authKey: "justtheauththanks"
});
receiver.addUser ({
    name: "shades",
    level: snmp.SecurityLevel.authPriv,
    authProtocol: snmp.AuthProtocols.sha,
    authKey: "illhavesomeauth",
    privProtocol: snmp.PrivProtocols.des,
    privKey: "andsomepriv"
});
receiver.addCommunity("public");
