var snmp = require ("../");
var getopts = require ("getopts");
var fs = require("fs");

var options = getopts(process.argv.slice(2));

var snmpOptions = {
    disableAuthorization: options.n,
    port: options.p,
    engineID: options.e,
    debug: options.d,
    address: null,
    accessControlModelType: snmp.AccessControlModelType.Simple
};

var callback = function (error, data) {
    if ( error ) {
        console.error (error);
    } else {
        console.log ("callback: " + JSON.stringify(data.pdu.varbinds, null, 2));
    }
};

var agent = snmp.createAgent(snmpOptions, callback);
var authorizer = agent.getAuthorizer ();
authorizer.addCommunity ("denied");
authorizer.addCommunity ("public");
authorizer.addCommunity ("private");
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
    scalarType: snmp.ObjectType.OctetString,
    maxAccess: snmp.MaxAccess['read-write'],
    constraints: {
        sizes: [
            { min: 1, max: 3 },
            { min: 5 }
        ]
    }
};
agent.registerProvider (scalarProvider);

scalarProvider = {
    name: "snmpEnableAuthenTraps",
    type: snmp.MibProviderType.Scalar,
    oid: "1.3.6.1.2.1.11.30",
    scalarType: snmp.ObjectType.Integer,
//	createHandler: (provider) => 42,
    maxAccess: snmp.MaxAccess['read-create'],
    constraints: {
        ranges: [
            { min: 1, max: 3 },
            { min: 5 }
        ]
    },
	defVal: 1
};
agent.registerProvider (scalarProvider);

var tableProvider = {
    name: "ifTable",
    type: snmp.MibProviderType.Table,
    oid: "1.3.6.1.2.1.2.2.1",
//	createHandler: (provider, action, row) => [ row[0], "Locally-created", 24, snmp.RowStatus[action] ],
    maxAccess: snmp.MaxAccess['not-accessible'],
	rowStatusColumn: 99,
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
			maxAccess: snmp.MaxAccess['read-write'],
			defVal: "Hello world!"
        },
        {
            number: 3,
            name: "ifType",
            type: snmp.ObjectType.Integer,
            maxAccess: snmp.MaxAccess['read-only'],
            constraints: {
                enumeration: {
                    "1": "goodif",
                    "2": "badif",
                    "6": "someif",
                    "24": "anotherif"
                }
            },
			defVal: 6
        },
        {
            number: 99,
            name: "ifStatus",
            type: snmp.ObjectType.Integer,
            maxAccess: snmp.MaxAccess['read-write'],
            rowStatus: true
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

// Modify defaults
mib.setScalarDefaultValue ("snmpEnableAuthenTraps", 3);
mib.setTableRowDefaultValues( "ifTable", [ undefined, "Hello world, amended!", 2, undefined ] );

mib.setScalarValue ("sysDescr", "Rage inside the machine!");
mib.addTableRow ("ifTable", [1, "lo", 24, 1]);
mib.addTableRow ("ifTable", [2, "eth0", 6, 2]);
// mib.deleteTableRow ("ifTable", [2]);
// mib.unregisterProvider ("ifTable");
// mib.unregisterProvider ("sysDescr");

// var store = snmp.createModuleStore ();
// var providers = store.getProviders ("IF-MIB");
// mib.registerProviders (providers);

// console.log (JSON.stringify (mib.providers, null, 2));

var changes;

// If there's a persistent store, make its specified changes
try {
	changes = JSON.parse(fs.readFileSync("persistent.json"));

	for (var providerName in changes) {
		var change = changes[providerName];
		if (typeof change == "object") {
			// table row
			for (var rowIndex in change) {
				mib.addTableRow(providerName, change[rowIndex]);
			}
		} else {
			mib.setScalarValue(providerName, change);
		}
	}
} catch (e) {
	console.log("Could not parse persistent storage");
	changes = {};
}

// If there's a persistent store, make its specified changes
try {
	changes = JSON.parse(fs.readFileSync("persistent.json"));

	for (var providerName in changes) {
		var change = changes[providerName];
		if (typeof change == "object") {
			// table row
			for (var rowIndex in change) {
				mib.addTableRow(providerName, change[rowIndex]);
			}
		} else {
			mib.setScalarValue(providerName, change);
		}
	}
} catch (e) {
	console.log("Could not parse persistent storage");
	changes = {};
}

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
mib.setTableSingleCell ("ifTable", 3, [2], 99);
var data = mib.getTableSingleCell ("ifTable", 3, [2]);
// var data = mib.getScalarValue ("sysDescr");

console.log(JSON.stringify (data, null, 2));

var acm = authorizer.getAccessControlModel ();
acm.setCommunityAccess ("denied", snmp.AccessLevel.None);
acm.setCommunityAccess ("public", snmp.AccessLevel.ReadOnly);
acm.setCommunityAccess ("private", snmp.AccessLevel.ReadWrite);
acm.setUserAccess ("fred", snmp.AccessLevel.ReadWrite);
console.log ("private = ", acm.getCommunityAccess ("private"));
console.log (acm.getCommunitiesAccess ());

// Demonstrate (a very poor, dangerous implementation of) persistence
agent.setAgentEventHandler(
	(message) => {
		console.log("Agent event: ", message);

		var index;
		var data;
		var isChanged = false;

		switch ( message.eventType ) {
			case "autoCreateScalar":
			case "set":
				if ( "row" in message ) {
					index = JSON.stringify(message.row);
					if (! changes[message.providerName]) {
						changes[message.ProviderName] = {};
					}
					data = mib.getTableRowCells(message.providerName, message.row);
					data = data.map((v) => v instanceof Buffer ? v.toString() : v);
					changes[message.providerName][index] = data;
				} else {
					data = message.value;
					data = data instanceof Buffer ? data.toString() : data;
					changes[message.providerName] = data;
				}
				isChanged = true;
				break;

			case "autoCreateTableRow":
				index = JSON.stringify(message.row);
				if (! changes[message.providerName]) {
					changes[message.providerName] = {};
				}
				data = message.values;
				data = data.map((v) => v instanceof Buffer ? v.toString() : v);
				changes[message.providerName][index] = data;
				isChanged = true;
				break;

			case "tableRowDeleted":
				index = JSON.stringify(message.row);
				delete changes[message.providerName][index];
				if (Object.keys(changes[message.providerName]).length === 0) {
					delete changes[message.providerName];
				}
				isChanged = true;
				break;

			default:
				break;
		}

		console.log("saving changes=", JSON.stringify(changes, null, "	"));

		if (isChanged) {
			fs.writeFileSync("persistent.json", JSON.stringify(changes, null, "	 "));
		}
	});
