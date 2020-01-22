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
        console.log (data.pdu.varbinds[0].oid);
    }
};

var store = snmp.createModuleStore ();
//var agent = snmp.createAgent (snmpOptions, callback);
//var agent = snmp.createAgent ({disableAuthorization: true, port: 1161}, function (error, data) {});
var agent = snmp.createAgent ({disableAuthorization: true, port: 1161}, callback);
var mib = agent.getMib ();

var authorizer = agent.getAuthorizer ();
authorizer.addCommunity ("public");

// IF-MIB
store.loadFromFile ("./mibs/IANAifType-MIB.mib");
store.loadFromFile ("/var/tmp/mibs/IF-MIB.mib");
mib.registerProviders (store.getProvidersForModule ("IF-MIB"));
mib.setScalarValue ("ifNumber", 5);

// SNMPv2-MIB
store.loadFromFile ("./mibs/SNMPv2-MIB.mib");
var providers = store.getProvidersForModule ("SNMPv2-MIB");
mib.registerProviders (providers);
mib.setScalarValue ("sysDescr", "The most powerful system you can think of");
mib.setScalarValue ("sysName", "multiplied-by-six");
mib.addTableRow ("sysOREntry", [1, "1.3.6.1.4.1.47491.42.43.44.45", "I've dreamed up this MIB", 20]);

// List providers
for ( var provider of providers ) {
    extraInfo = provider.type == snmp.MibProviderType.Scalar ? snmp.ObjectType[provider.scalarType] : "Columns = " + provider.columns.length;
    console.log(snmp.MibProviderType[provider.type] + ": " + provider.name + " (" + provider.oid + "): " + extraInfo);
}
// console.log (JSON.stringify (providers, null, 2));

mib.dump ({
    leavesOnly: true,
    showProviders: true,
    showValues: true,
    showTypes: true
});

// modules = store.getModules (true);
// one = store.getModule ("SNMPv2-MIB");
// names = store.getModuleNames (true);
