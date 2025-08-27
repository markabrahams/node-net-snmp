var snmp = require ("../");
var getopts = require ("getopts");

var options = getopts(process.argv.slice(2));

var snmpOptions = {
    debug: options.d,
    master: options.m,
    port: options.p
};

var agent = snmp.createSubagent(snmpOptions);

var stringProvider = {
    name: "scalarString",
    type: snmp.MibProviderType.Scalar,
    oid: "1.3.6.1.4.1.8072.9999.9999.1",
    scalarType: snmp.ObjectType.OctetString,
    maxAccess: snmp.MaxAccess["read-write"]
};
var intProvider = {
    name: "scalarInt",
    type: snmp.MibProviderType.Scalar,
    oid: "1.3.6.1.4.1.8072.9999.9999.3",
    scalarType: snmp.ObjectType.Integer,
    maxAccess: snmp.MaxAccess["read-write"]
};
var tableProvider = {
    name: "smallIfTable",
    type: snmp.MibProviderType.Table,
    oid: "1.3.6.1.4.1.8072.9999.9999.2",
    maxAccess: snmp.MaxAccess['not-accessible'],
    tableColumns: [
        {
            number: 1,
            name: "ifIndex",
            type: snmp.ObjectType.Integer,
            maxAccess: snmp.MaxAccess['read-only']
        },
        {
            number: 2,
            name: "ifDescr",
            type: snmp.ObjectType.OctetString,
            maxAccess: snmp.MaxAccess['read-write']
        },
        {
            number: 3,
            name: "ifType",
            type: snmp.ObjectType.Integer,
            maxAccess: snmp.MaxAccess['read-only']
        }
    ],
    tableIndex: [
        {
            columnName: "ifIndex"
        }
    ],

};

agent.open(function (error, data) {
    if ( error ) {
        console.error (error);
    } else {
        agent.registerProvider (stringProvider, null);
        agent.getMib ().setScalarValue ("scalarString", "Rage inside the machine!");
        agent.registerProvider (intProvider, null);
        agent.getMib ().setScalarValue ("scalarInt", 2000);
        agent.registerProvider (tableProvider, null);
        agent.getMib ().addTableRow ("smallIfTable", [1, "lo", 24]);
        agent.getMib ().addTableRow ("smallIfTable", [2, "eth0", 6]);
        
        console.log("AgentX subagent ready and providers registered successfully.");
        
        agent.on("close", function() {
            console.log ("Subagent socket closed");
        });

        // Handle graceful shutdown on Ctrl-C
        process.on('SIGINT', function() {
            console.log('\nReceived SIGINT. Cleaning up...');
            
            // Unregister all providers
            try {
                agent.unregisterProvider("scalarString", function(err, data) {
                    if (err) console.error("Error unregistering scalarString:", err);
                });
                agent.unregisterProvider("scalarInt", function(err, data) {
                    if (err) console.error("Error unregistering scalarInt:", err);
                });
                agent.unregisterProvider("smallIfTable", function(err, data) {
                    if (err) console.error("Error unregistering smallIfTable:", err);
                });
            } catch (e) {
                console.error("Error during unregistration:", e.message);
            }

            // Close the agent after a brief delay to allow unregistrations to complete
            setTimeout(function() {
                agent.close(function(err) {
                    if (err) console.error("Error closing agent:", err);
                    console.log("Agent closed gracefully");
                    process.exit(0);
                });
            }, 100);
        });
    }
});

// setTimeout( function() {
//     agent.open();
//     agent.close();
//     agent.unregisterProvider (intProvider.name, null);
//     agent.addAgentCaps ("1.3.6.1.4.1.8072.9999.9999", "Marks funk");
//     agent.removeAgentCaps ("1.3.6.1.4.1.8072.9999.9999");
//     agent.ping (function(error, pdu) {
//         console.log("Received ping response:");
//         console.log(pdu);
//     });
//     agent.notify(snmp.TrapType.ColdStart);
// }, 5000);
