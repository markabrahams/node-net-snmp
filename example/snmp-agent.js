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
        console.log (JSON.stringify(data.pdu.varbinds, null, 2));
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
    scalarType: snmp.ObjectType.OctetString
};
agent.registerProvider (scalarProvider);
var tableProvider = {
    name: "ifTable",
    type: snmp.MibProviderType.Table,
    oid: "1.3.6.1.2.1.2.2.1",
    columns: [
        {
            number: 1,
            name: "ifIndex",
            type: snmp.ObjectType.Integer
        },
        {
            number: 2,
            name: "ifDescr",
            type: snmp.ObjectType.OctetString
        },
        {
            number: 3,
            name: "ifType",
            type: snmp.ObjectType.Integer
        }
    ],
    index: [1],
    handler: function ifTable (mibRequest) {
        // e.g. can update the table before responding to the request here
        mibRequest.done ();
    }
};
agent.registerProvider (tableProvider);

agent.mib.setScalarValue ("sysDescr", "Rage inside the machine!");
//agent.mib.setScalarValue ("sysLocation", "Stuck in the middle with you");
agent.mib.addTableRow ("ifTable", [1, "lo", 24]);
agent.mib.addTableRow ("ifTable", [2, "eth0", 6]);
// agent.mib.deleteTableRow ("ifTable", [2]);
// agent.unregisterProvider ("ifTable");
// agent.unregisterProvider ("sysDescr");

agent.mib.dump ({
    leavesOnly: true,
    showProviders: true,
    showValues: true,
    showTypes: true
});

// var data = agent.mib.getTableColumnDefinitions("ifTable");
// var data = agent.mib.getTableCells("ifTable", true);
// var data = agent.mib.getTableColumnCells("ifTable", 2);
// var data = agent.mib.getTableRowCells("ifTable", [1]);
// agent.mib.setTableSingleCell("ifTable", 2, [2], "changed!");
// var data = agent.mib.getTableSingleCell("ifTable", 2, [2]);
var data = agent.mib.getScalarValue("sysDescr");

console.log(JSON.stringify(data, null, 2));
