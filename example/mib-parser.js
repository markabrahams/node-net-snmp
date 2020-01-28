var snmp = require ("../");
var getopts = require ("getopts");

var options = getopts(process.argv.slice(2));
var providers;
var mibDir = '/var/tmp/mibs/';

var counter64 = function (num) {
    var buf = Buffer.alloc (4);
    buf.writeUInt32BE (num);
    return buf;
};

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
var agent = snmp.createAgent (snmpOptions, callback);
var mib = agent.getMib ();

var authorizer = agent.getAuthorizer ();
authorizer.addCommunity ("public");

// IF-MIB load and providers registration
store.loadFromFile (mibDir + "IANAifType-MIB.mib");
store.loadFromFile (mibDir + "IF-MIB.wrong");
providers = store.getProvidersForModule ("IF-MIB");
mib.registerProviders (providers);

// ifNumber
// Scalar type - setScalarValue() and getScalarValue() are the entire API for these
mib.setScalarValue ("ifNumber", 5);
var ifNumberValue = mib.getScalarValue ("ifNumber", 5)
// console.log (ifNumberValue);

// ifEntry
// Simplest table index - a single-column local index
mib.addTableRow ("ifEntry", [1, "eth0", 6, 1500, 1000, "", 1, 1, 10, 1000, 100, 10, 0, 0, 0, 2000, 200, 20, 0, 0, 5, "0.0"]);
mib.addTableRow ("ifEntry", [2, "eth1", 6, 1500, 1000, "", 1, 1, 10, 1000, 100, 10, 0, 0, 0, 2000, 200, 20, 0, 0, 5, "0.0"]);
mib.setTableSingleCell ("ifEntry", 2, [1], "eth2");
var ifEntryRow1 = mib.getTableRowCells ("ifEntry", [2]);
// console.log (ifEntryRow1);

// ifXEntry
// AUGMENTS ifEntry - meaning a single integer foreign key
mib.addTableRow ("ifXEntry", [1, "eth0", 10, 2, 20, 4, counter64(1000), counter64(100), counter64(50), counter64(20),
        counter64(2000), counter64(200), counter64(100), counter64(40), 1, 1000, 0, 1, "myeth0", 10]);
var ifXEntryRow1 = mib.getTableRowCells ("ifXEntry", [1]);
// console.log (ifXEntryRow1);
var ifXEntryData1 = mib.getTableCells ("ifXEntry", false, false);
var ifXEntryData2 = mib.getTableCells ("ifXEntry", true, false);
var ifXEntryData3 = mib.getTableCells ("ifXEntry", false, true);
var ifXEntryData4 = mib.getTableCells ("ifXEntry", true, true);
mib.setTableSingleCell ("ifXEntry", 1, [1], "another0");

// ifStackEntry
// Composite index - two local columns
mib.addTableRow ("ifStackEntry", [1, 2, 1]);
mib.addTableRow ("ifStackEntry", [3, 4, 2]);
//mib.deleteTableRow ("ifStackEntry", [2, 3]);
// var data = mib.getTableCells ("ifStackEntry");
var ifStackEntryColumn1 = mib.getTableColumnCells ("ifStackEntry", 3, true);
var ifStackEntryData1 = mib.getTableCells ("ifStackEntry", false, false);
var ifStackEntryData2 = mib.getTableCells ("ifStackEntry", true, false);
var ifStackEntryData3 = mib.getTableCells ("ifStackEntry", false, true);
var ifStackEntryData4 = mib.getTableCells ("ifStackEntry", true, true);
var ifStackEntryRow1 = mib.getTableRowCells ("ifStackEntry", [3, 4]);
var ifStackEntryCell1 = mib.getTableSingleCell ("ifStackEntry", 1, [1, 2]);

// ifRcvAddressEntry
// Composite index - one foreign integer column, one local string column
mib.addTableRow ("ifRcvAddressEntry", [1, "24:41:8c:08:87:5c", 1, 6])
var ifRcvAddressEntryRow1 = mib.getTableRowCells ("ifRcvAddressEntry", [1, "24:41:8c:08:87:5c"]);
var ifRcvAddressEntryCell1 = mib.getTableSingleCell ("ifRcvAddressEntry", 3, [1, "24:41:8c:08:87:5c"]);
var ifRcvAddressEntryData1 = mib.getTableCells ("ifRcvAddressEntry", false, false);
var ifRcvAddressEntryData2 = mib.getTableCells ("ifRcvAddressEntry", true, false);
var ifRcvAddressEntryData3 = mib.getTableCells ("ifRcvAddressEntry", false, true);
var ifRcvAddressEntryData4 = mib.getTableCells ("ifRcvAddressEntry", true, true);

// SNMP-COMMUNITY-MIB
store.loadFromFile (mibDir + "SNMP-FRAMEWORK-MIB.mib");
store.loadFromFile (mibDir + "SNMP-TARGET-MIB.mib");
store.loadFromFile (mibDir + "SNMP-COMMUNITY-MIB.mib");
providers = store.getProvidersForModule ("SNMP-TARGET-MIB");
mib.registerProviders (providers);
providers = store.getProvidersForModule ("SNMP-COMMUNITY-MIB");
mib.registerProviders (providers);
mib.addTableRow ("snmpCommunityEntry", ["mark", "public", "publicsec", "80001234", "", "", 1, 1]);

// SNMPv2-MIB - loaded as part of base module load
// store.loadFromFile (mibDir + "SNMPv2-MIB.mib");
providers = store.getProvidersForModule ("SNMPv2-MIB");
mib.registerProviders (providers);
mib.setScalarValue ("sysDescr", "The most powerful system you can think of");
mib.setScalarValue ("sysName", "multiplied-by-six");
mib.addTableRow ("sysOREntry", [1, "1.3.6.1.4.1.47491.42.43.44.45", "I've dreamed up this MIB", 20]);

// agent.getMib ().dumpProviders ();

mib.dump();

// modules = store.getModules (true);
// one = store.getModule ("SNMPv2-MIB");
// names = store.getModuleNames (true);
