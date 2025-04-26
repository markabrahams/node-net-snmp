const snmp = require ("..");

// Create a module store, which contains SNMPv2-MIB and other modules
const store = snmp.createModuleStore ();

// Fetch MIB providers for SNMPv2-MIB, create an agent, and register the providers with the agent's MIB
const providers = store.getProvidersForModule ("SNMPv2-MIB");
const agentOptions = {
    port: 1161
};
const agentCallback = function (error, data) {
    if ( error ) {
        console.error (error);
    } else {
        console.log (JSON.stringify(data, null, 2));
    }
};
const agent = snmp.createAgent ( agentOptions, agentCallback );
const mib = agent.getMib ();
mib.registerProviders (providers);

// Add community and user to agent's authorizer
const authorizer = agent.getAuthorizer ();
authorizer.addCommunity ("private");
authorizer.addUser ({
    name: "wilma",
    level: snmp.SecurityLevel.authPriv,
    authProtocol: snmp.AuthProtocols.sha,
    authKey: "illhavesomeauth",
    privProtocol: snmp.PrivProtocols.aes,
    privKey: "andsomepriv"
});

// Start adding data to the MIB through the registered providers using the `Mib` API calls
mib.setScalarValue ("sysDescr", "The most powerful system you can think of");
mib.setScalarValue ("sysObjectID", "1.3.6.1.4.1.8072.3.2.10");
mib.setScalarValue ("sysContact", "You");
mib.setScalarValue ("sysName", "megamind");
mib.setScalarValue ("sysLocation", "Yours");
mib.setScalarValue ("sysORLastChange", 710);
mib.addTableRow ("sysOREntry", [1, "1.3.6.1.4.1.47491.42.43.44.45", "I've dreamed up this MIB", 20]);

// Dump the resulting MIB to the console
mib.dump ();
