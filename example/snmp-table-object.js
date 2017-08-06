
var snmp = require ("../");

if (process.argv.length < 6) {
	console.log ("usage: snmp-table <target> <community> <version> <oid>");
	process.exit (1);
}

var target = process.argv[2];
var community = process.argv[3];
var version = (process.argv[4] == "2c") ? snmp.Version2c : snmp.Version1;

var oid = process.argv[5];

var session = snmp.createSession (target, community, {version: version});


//This is the Table definition so the object can be developed automatically.
//Each column has a type of "string", "enum", "hex", "uint64" or, if left alone it is treated as the default base type.
//Enums are converted to strings of the specified value or, if the value isn't specified, the number is used.
var InterfaceTableDefinition = {
    BaseOID: "1.3.6.1.2.1.2.2",
    Columns: {
        1: { name: "ifIndex" },
        2: { name: "ifDescr", type: "string" },
        3: { name: "ifType", type: "enum", enum: { 1: 'other', 2: 'regular1822', 3: 'hdh1822', 4: 'ddn-x25', 5: 'rfc877-x25', 6: 'ethernet-csmacd', 7: 'iso88023-csmacd', 8: 'iso88024-tokenBus', 9: 'iso88025-tokenRing', 10: 'iso88026-man', 11: 'starLan', 12: 'proteon-10Mbit', 13: 'proteon-80Mbit', 14: 'hyperchannel', 15: 'fddi', 16: 'lapb', 17: 'sdlc', 18: 'ds1', 19: 'e1', 20: 'basicISDN', 21: 'primaryISDN', 22: 'propPointToPointSerial', 23: 'ppp', 24: 'softwareLoopback', 25: 'eon', 26: 'ethernet-3Mbit', 27: 'nsip', 28: 'slip', 29: 'ultra', 30: 'ds3', 31: 'sip', 32: 'frame-relay' } },
        4: { name: "ifMtu" },
        5: { name: "ifSpeed" },
        6: { name: "ifPhysAddress", type: "hex" },
        7: { name: "ifAdminStatus", type: "enum", enum: { 1: "up", 2: "down", 3: "testing" } },
        8: { name: "ifOperStatus", type: "enum", enum: { 1: "up", 2: "down", 3: "testing" } },
        9: { name: "ifLastChange" },
        10: { name: "ifInOctets" },
        11: { name: "ifInUcastPkts" },
        12: { name: "ifInNUcastPkts" },
        13: { name: "ifInDiscards" },
        14: { name: "ifInErrors" },
        15: { name: "ifInUnknownProtos" },
        16: { name: "ifOutOctets" },
        17: { name: "ifOutUcastPkts" },
        18: { name: "ifOutNUcastPkts" },
        19: { name: "ifOutDiscards" },
        20: { name: "ifOutErrors" },
        21: { name: "ifOutQLen" },
        22: { name: "ifSpecific" }
    }
};



function responseCb (error, table) {
	if (error) {
		console.error (error.toString ());
	} else {
		console.log(JSON.stringify(table));
	}
}

var maxRepetitions = 20;

// The maxRepetitions argument is optional, and will be ignored unless using
// SNMP verison 2c
session.table (oid, maxRepetitions, responseCb);