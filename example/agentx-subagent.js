var snmp = require ("../");
var getopts = require ("getopts");

var options = getopts(process.argv.slice(2));

var snmpOptions = {
    debug: options.d,
    master: options.m,
    port: options.p
};

var callback = function (error, data) {
    if ( error ) {
        console.error (error);
    } else {
        console.log (JSON.stringify(data.pdu.varbinds, null, 2));
    }
};

var agent = snmp.createSubagent(snmpOptions, callback);

var stringProvider = {
    name: "scalarString",
    type: snmp.MibProviderType.Scalar,
    oid: "1.3.6.1.4.1.8072.9999.9999.1",
    scalarType: snmp.ObjectType.OctetString
};
var intProvider = {
    name: "scalarInt",
    type: snmp.MibProviderType.Scalar,
    oid: "1.3.6.1.4.1.8072.9999.9999.3",
    scalarType: snmp.ObjectType.Integer
};

agent.open(function (error, data) {
    if ( error ) {
        console.error (error);
    } else {
        agent.registerProvider (stringProvider, null);
        agent.getMib ().setScalarValue ("scalarString", "Rage inside the machine!");
        agent.registerProvider (intProvider, null);
        agent.getMib ().setScalarValue ("scalarInt", 2000);
    }
});

setTimeout( function() {
    // agent.open();
    // agent.close();
    // agent.unregisterProvider (intProvider, null);
    // agent.addAgentCaps ("1.3.6.1.4.1.8072.9999.9999", "Marks funk");
    // agent.removeAgentCaps ("1.3.6.1.4.1.8072.9999.9999");
}, 2000);

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
// agent.registerProvider (tableProvider);
