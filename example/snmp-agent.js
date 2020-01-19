var snmp = require ("../");
var getopts = require ("getopts");

var options = getopts(process.argv.slice(2));

var snmpOptions = {
    disableAuthorization: options.n,
    port: options.p,
    engineID: options.e,
    debug: options.d
};

var callback = function (error, data) {
    if ( error ) {
        console.error (error);
    } else {
        console.log (JSON.stringify(data, null, 2));
    }
};

var agent = snmp.createAgent(snmpOptions, callback);
agent.getAuthorizer().addCommunity ("public");
agent.getAuthorizer().addUser ({
    name: "fred",
    level: snmp.SecurityLevel.noAuthNoPriv
});
agent.getAuthorizer().addUser ({
    name: "betty",
    level: snmp.SecurityLevel.authNoPriv,
    authProtocol: snmp.AuthProtocols.sha,
    authKey: "illhavesomeauth"
});
agent.getAuthorizer().addUser ({
    name: "wilma",
    level: snmp.SecurityLevel.authPriv,
    authProtocol: snmp.AuthProtocols.sha,
    authKey: "illhavesomeauth",
    privProtocol: snmp.PrivProtocols.des,
    privKey: "andsomepriv"
});
// console.log(JSON.stringify(agent.getAuthorizer().getUsers(), null, 2));

var scalarProvider = {
    name: "sysDescr",
    type: snmp.MibProviderType.Scalar,
    oid: "1.3.6.1.2.1.1.1",
    valueType: snmp.ObjectType.OctetString,
    handler: function sysDescr (mibRequest) {
        mibRequest.done ();
    }
};
agent.addProvider (scalarProvider);
var tableProvider = {
    name: "ifTable",
    type: snmp.MibProviderType.Table,
    oid: "1.3.6.1.2.1.2.2.1",
    columns: [1, 2, 3],
    index: [1],
    handler: function ifTable (mibRequest) {
        mibRequest.done ();
    }
};
agent.addProvider (tableProvider);

agent.mib.setScalarValue ("sysDescr", "Rage inside the machine!");
agent.mib.addTableRow ("ifTable", [1, "eth0", 6]);

agent.mib.dump (true, true);
