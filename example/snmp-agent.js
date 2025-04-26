var snmp = require ("../");
var fs = require("fs");
var getopts = require ("getopts");

var options = getopts(process.argv.slice(2));

var snmpOptions = {
    disableAuthorization: options.n,
    port: options.p,
    engineID: options.e,
    debug: options.d,
    address: null,
    accessControlModelType: snmp.AccessControlModelType.Simple
};

if (options.s) {
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
	} catch (error) {
		console.log("Could not parse persistent storage", error);
		changes = {};
	}
}

var callback = function (error, data) {
    var needSave;

	if ( error ) {
		console.error (error);
		return;
	}

	console.log (JSON.stringify(data.pdu.varbinds, null, 2));

    // If the user didn't request testing persistent storage, we're done here
    if (! options.s) {
        return;
    }

    // Keep note of whether we need to save
    needSave = false;

	data.pdu.varbinds.forEach(
		(varbind) => {
            let index;
			let value;

            // If there was a request error, we don't need to do anything
            if ("errorStatus" in varbind || ! ("providerName" in varbind) ) {
              return;
            }

			if (varbind.autoCreated && "rowIndex" in varbind) {
				// Auto-create table row
				index = JSON.stringify(varbind.rowIndex);
				if ( ! changes[varbind.providerName] ) {
					changes[varbind.providerName] = {};
				}
				value = varbind.row;
				value = value.map((v) => v instanceof Buffer ? v.toString() : v);
				changes[varbind.providerName][index] = value;
                needSave = true;
			} else if (varbind.autoCreated) {
				// Auto-created scalar
				value = varbind.value;
				value = value instanceof Buffer ? value.toString() : value;
				changes[varbind.providerName] = value;
                needSave = true;
			} else if (varbind.deleted && "rowIndex" in varbind) {
				// Delete table row
				index = JSON.stringify(varbind.rowIndex);
				if (changes && changes[varbind.providerName] && changes[varbind.providerName][index]) {
					delete changes[varbind.providerName][index];
					if (Object.keys(changes[varbind.providerName]).length === 0) {
						delete changes[varbind.providerName];
					}
				}
                needSave = true;
			} else if ("requestValue" in varbind && "rowIndex" in varbind && "column" in varbind) {
				// Set a column value
				value = varbind.value;
				index = JSON.stringify(varbind.rowIndex);
				changes[varbind.providerName][index][varbind.columnPosition] =
					value instanceof Buffer ? value.toString() : value;
                needSave = true;
			} else if ("requestValue" in varbind) {
				// Set a scalar
				value = varbind.value;
				changes[varbind.providerName] =
					value instanceof Buffer ? value.toString() : value;
                needSave = true;
			} else {
              console.log("Ignoring varbind:" + JSON.stringify(varbind, null, "  "));
            }
		});

    // Did we make any changes?
	if (needSave) {
		// Yup. Save 'em.
		fs.writeFileSync("persistent.json", JSON.stringify(changes, null, "	 "));
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
            constraints: {
                sizes: [
                    { min: 1, max: 255 },
                ]
            },
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
mib.setTableSingleCell ("ifTable", 3, [2], 24);
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
