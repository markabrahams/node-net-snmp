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
var authorizer = agent.getAuthorizer ();
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
    tableColumns: [
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
    tableIndex: [
        {
            columnName: "ifIndex"
        }
    ],
    handler: function ifTable (mibRequest) {
        // e.g. can update the table before responding to the request here
        mibRequest.done ();
    }
};
agent.registerProvider (tableProvider);

var mib = agent.getMib ();
mib.setScalarValue ("sysDescr", "Rage inside the machine!");
mib.addTableRow ("ifTable", [1, "lo", 24]);
mib.addTableRow ("ifTable", [2, "eth0", 6]);
// mib.deleteTableRow ("ifTable", [2]);
// mib.unregisterProvider ("ifTable");
// mib.unregisterProvider ("sysDescr");

// var store = snmp.createModuleStore ();
// var providers = store.getProviders ("IF-MIB");
// mib.registerProviders (providers);

//console.log (JSON.stringify (providers, null, 2));

mib.dump ({
    leavesOnly: true,
    showProviders: true,
    showValues: true,
    showTypes: true
});

// var data = mib.getTableColumnDefinitions ("ifTable");
// var data = mib.getTableCells ("ifTable", true);
// var data = mib.getTableColumnCells ("ifTable", 2);
// var data = mib.getTableRowCells ("ifTable", [1]);
// mib.setTableSingleCell ("ifTable", 2, [2], "changed!");
var data = mib.getTableSingleCell ("ifTable", 2, [2]);
// var data = mib.getScalarValue ("sysDescr");

console.log(JSON.stringify (data, null, 2));
