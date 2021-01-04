let             snmp;
let             mib;

/**
 * Main program for this example
 */
function main()
{
  let             agent;
  let             store;
  let             authorizer;

  snmp = require ("../");

  // Create the MIB up front, so we have access to it
  mib = mib = snmp.createMib();

  // Create the SNMP Agent
  agent = snmp.createAgent(
    {
      //
      // TODO:
      // add proper options here, including auth, priv keys
      //
      port : 1611
    },
    (e, data) =>
    {
      if (e)
      {
        console.error("Agent callback:", e);
        return;
      }
    },
    mib);


  // Set handlers for scalar auto-create and RowStatus
  agent.setScalarReadCreateHandler(scalarReadCreateHandler);
  agent.setTableRowStatusHandler(tableRowStatusHandler);


  // Create the module store which additionally reads in the
  // base modules
  store = snmp.createModuleStore();

  // Load additional base files not in the net-snmp default list,
  // but needed by our non-base modules
  [
    "IPV6-TC"
  ].forEach(
    (module) =>
    {
      store.loadFromFile(`mibs/${module}.txt`);
    });

  // Load non-base modules
  [
    "RSU-MIB"
  ].forEach(
    (module) =>
    {
      // let             jsonModule;
      let             providers;

      // Retrieve this file
      store.loadFromFile(`mibs/${module}.txt`);

      // Fetch providers for this module
      providers = store.getProvidersForModule(module);

      // Temporarily "fix" the RSU MIB. It makes index entries in tables
      // not-accessible, which prevents tree walks.
      if (module == "RSU-MIB")
      {
        const           tableNames =
          [
            "rsuSRMStatusTable",
            "rsuIFMStatusTable",
            "rsuDsrcForwardTable",
            "rsuInterfaceLogTable",
            "rsuDsrcChannelModeTable",
            "rsuWsaServiceTable",
            "rsuMessageCountsByPsidTable",
            "rsuSetSlaveTable"
          ];

        providers
          .filter(entry => tableNames.includes(entry.tableName))
          .forEach(
            (tableProvider) =>
            {
              const           tc = tableProvider.tableColumns;

              // Expect to find index column (wrongly) not-accessible
              if (tc[0].maxAccess !==
                  snmp.MaxAccess["not-accessible"])
              {
                console.warn(
                  "Expected index to be not-accessible; found " +
                    tc[0].maxAccess);
                return;
              }

              // Change it to read-only
              console.log(`Changing ${tc[0].name} to read-only`);
              tc[0].maxAccess = snmp.MaxAccess["read-only"];
            });
      }

      // Register the providers
      agent.getMib().registerProviders(providers);
    });

  // Add providers for each of our dynamic values
  addDynamicProviders();

  // Ensure there is an instance for each table object
  mib.addTableRow(
    "rsuSRMStatusEntry",
    [
      1, "1234", 18, 1, 172, 1000, "07e10a071722", "", "hello world", 1, 1
    ]);
  mib.addTableRow(
    "rsuIFMStatusEntry",
    [
      1, "1234", 18, 1, 172, 1, 1
    ]);
  mib.addTableRow(
    "rsuDsrcForwardEntry",
    [
      1, "1234", "20010333002200EF0000000000000001", 1024, 1, -80, 3, "", "", 1, 1
    ]);
  mib.addTableRow(
    "rsuInterfaceLogEntry",
    [
      1, 1, 15, 2, 1, "eth0"
    ]);
  mib.addTableRow(
    "rsuDsrcChannelModeEntry",
    [
      1, "radio1", 1, 172, 173
    ]);
  mib.addTableRow(
    "rsuWsaServiceEntry",
    [
      1, "1234", 4, "", "20010333002200EF0000000000000001", 1024, 172, 1
    ]);
  mib.addTableRow(
    "rsuMessageCountsByPsidEntry",
    [
      1, "1234", 0, 1
    ]);
  mib.addTableRow(
    "rsuSetSlaveEntry",
    [
      1, "20010333002200EF0000000000000001", 1
    ]);


  // Ensure there is an instance for each scalar object
  Object.keys(mib.providers).forEach(
    (name) =>
    {
      let             entry = mib.providers[name];

      // Is this a scalar or a table?
      switch(entry.type)
      {
      case 1 :      // scalar
        switch(entry.scalarType)
        {
        case 2 : // "Integer" :
          mib.setScalarValue(name, 0);
          break;

        case 4 : //  "OctetString" :
          mib.setScalarValue(name, "");
          break;

        case 6 : // "OID":
          mib.setScalarValue(name, "0.0");
          break;

        case 65 : // "Counter" :
          mib.setScalarValue(name, 0);
          break;

        default :
          console.log("Not setting scalar value for ", entry);
          break;
        }
        break;

      case 2 :      // table
  //            console.log(`Adding initial table row entry for ${name}`);
  //            mib.addTableRow(name, [ 1, "", "", "", "", "", "", "", "", "", "", "", "", "", "" ]);
        break;
      }
    });

  // Indicate that this is an RSU
  mib.setScalarValue("rsuSysObjectID", "1.0.15628.4.1.6");

  // Add an instance for each table object
  mib.addTableRow(
    "rsuSRMStatusEntry",
    [
      1, "1234", 18, 1, 172, 1000, "07e10a071722", "", "hello world", 1, 1
    ]);
  mib.addTableRow(
    "rsuIFMStatusEntry",
    [
      1, "1234", 18, 1, 172, 1, 1
    ]);
  mib.addTableRow(
    "rsuDsrcForwardEntry",
    [
      1, "1234", "20010333002200EF0000000000000001", 1024, 1, -80, 3, "", "", 1, 1
    ]);
  mib.addTableRow(
    "rsuInterfaceLogEntry",
    [
      1, 1, 15, 2, 1, "eth0"
    ]);
  mib.addTableRow(
    "rsuDsrcChannelModeEntry",
    [
      1, "radio1", 1, 172, 173
    ]);
  mib.addTableRow(
    "rsuWsaServiceEntry",
    [
      1, "1234", 4, "", "20010333002200EF0000000000000001", 1024, 172, 1
    ]);
  mib.addTableRow(
    "rsuMessageCountsByPsidEntry",
    [
      1, "1234", 0, 1
    ]);
  mib.addTableRow(
    "rsuSetSlaveEntry",
    [
      1, "20010333002200EF0000000000000001", 1
    ]);

  //
  // DEBUG CODE...
  console.log("MIB provider nodes:");
  console.log(JSON.stringify(
    mib.providerNodes,
    (key, value) =>
    {
      return [ "parent", "address" ].includes(key) ? undefined : value;
    },
    "  "));
  console.log("");
  console.log("");

  // Show current MIB values
  console.log("MIB dump:");
  mib.dump();
  // ...DEBUG CODE
  //

  // Specify the community
  authorizer = agent.getAuthorizer();
  authorizer.addCommunity("public"); // TODO: select community name
}


/**
 * Create a sample DateAndTime value of the current timestamp
 */
function makeDateTime()
{
  const       timestamp = new Date();

  // Convert to SNMPv2-TC's DateAndTime octet string format
  const       year = timestamp.getUTCFullYear();
  const       month = timestamp.getUTCMonth() + 1;
  const       day = timestamp.getUTCDate();
  const       hour = timestamp.getUTCHours();
  const       minutes = timestamp.getUTCMinutes();
  const       seconds = timestamp.getUTCSeconds();
  const       decisecs = timestamp.getUTCMilliseconds() / 100;
  const       smartbuffer = require("smart-buffer");
  const       SmartBuffer = smartbuffer.SmartBuffer;
  const       octetstring = new SmartBuffer();

  octetstring.writeUInt16BE(year);
  octetstring.writeUInt8(month);
  octetstring.writeUInt8(day);
  octetstring.writeUInt8(hour);
  octetstring.writeUInt8(minutes);
  octetstring.writeUInt8(seconds);
  octetstring.writeUInt8(decisecs);

  return octetstring.toBuffer();

}



/**
 * Add all of our dynamic providers
 */
function addDynamicProviders()
{
  addScalarProvider(
    {
      name         : "rsuContMacAddress",
      type         : snmp.MibProviderType.Scalar,
      oid          : "1.0.15628.4.1.1",
      scalarType   : snmp.ObjectType.OctetString,
      maxAccess    : snmp.MaxAccess["read-only"],
      innerHandler : (mibRequest) =>  "does not exist" // TODO
    });

  addScalarProvider(
    {
      name         : "rsuAltMacAddress",
      type         : snmp.MibProviderType.Scalar,
      oid          : "1.0.15628.4.1.2",
      scalarType   : snmp.ObjectType.OctetString,
      maxAccess    : snmp.MaxAccess["read-only"],
      innerHandler : (mibRequest) => "does not exist" // TODO
    });

  addScalarProvider(
    {
      name         : "rsuGpsStatus",
      type         : snmp.MibProviderType.Scalar,
      oid          : "1.0.15628.4.1.3",
      scalarType   : snmp.ObjectType.Integer32,
      maxAccess    : snmp.MaxAccess["read-only"],
      innerHandler : (mibRequest) => 12              // TODO
    });

  addScalarProvider(
    {
      name         : "rsuGpsOutputString",
      type         : snmp.MibProviderType.Scalar,
      oid          : "1.0.15628.4.1.6",
      scalarType   : snmp.ObjectType.OctetString,
      maxAccess    : snmp.MaxAccess["read-only"],
      innerHandler : (mibRequest) => "todo"          // TODO
    });

  addScalarProvider(
    {
      name         : "rsuTimeSincePowerOn",
      type         : snmp.MibProviderType.Scalar,
      oid          : "1.0.15628.4.1.16.1",
      scalarType   : snmp.ObjectType.Counter32,
      maxAccess    : snmp.MaxAccess["read-only"],
      innerHandler : (mibRequest) => require("os").uptime()
    });

  addScalarProvider(
    {
      name         : "rsuLastLoginTime",
      type         : snmp.MibProviderType.Scalar,
      oid          : "1.0.15628.4.1.16.3",
      scalarType   : snmp.ObjectType.DateAndTime,
      maxAccess    : snmp.MaxAccess["read-only"],
      innerHandler : (mibRequest) => makeDateTime()
    });

  addScalarProvider(
    {
      name         : "rsuLastLoginUser",
      type         : snmp.MibProviderType.Scalar,
      oid          : "1.0.15628.4.1.16.4",
      scalarType   : snmp.ObjectType.DisplayString,
      maxAccess    : snmp.MaxAccess["read-only"],
      innerHandler : (mibRequest) => "derrell"
    });

  addScalarProvider(
    {
      name         : "rsuLastLoginSource",
      type         : snmp.MibProviderType.Scalar,
      oid          : "1.0.15628.4.1.16.5",
      scalarType   : snmp.ObjectType.DisplayString,
      maxAccess    : snmp.MaxAccess["read-only"],
      innerHandler : (mibRequest) => "localhost"
    });

  addScalarProvider(
    {
      name         : "rsuLastRestartTime",
      type         : snmp.MibProviderType.Scalar,
      oid          : "1.0.15628.4.1.16.6",
      scalarType   : snmp.ObjectType.DateAndTime,
      maxAccess    : snmp.MaxAccess["read-only"],
      innerHandler : (mibRequest) => makeDateTime()
    });

  addScalarProvider(
    {
      name         : "rsuIntTemp",
      type         : snmp.MibProviderType.Scalar,
      oid          : "1.0.15628.4.1.16.7",
      scalarType   : snmp.ObjectType.Integer32,
      maxAccess    : snmp.MaxAccess["read-only"],
      innerHandler : (mibRequest) => -100            // TODO
    });

  addScalarProvider(
    {
      name         : "rsuFirmwareVersion",
      type         : snmp.MibProviderType.Scalar,
      oid          : "1.0.15628.4.1.17.2",
      scalarType   : snmp.ObjectType.DisplayString,
      maxAccess    : snmp.MaxAccess["read-only"],
      innerHandler : (mibRequest) => "0.1"
    });
}

/**
 * Add a scalar provider
 *
 * @param registrationInfo
 *   This is equivalent to the data passed to `mib.registerProvider`
 *   except that instead of a complete handler, only the "inner" portion
 *   of the handler is provided, i.e., that portioni which is unique to
 *   this method. The boilerplate registering the provider and adding this
 *   new provider information to an existing node are done internally and
 *   need not be done by the `innerHandler`.
 *
 *   The provided `registrationInfo` map should contain the following
 *   fields:
 *     - name {String}
 *     - type {snmp.MibProviderType}
 *     - oid {String}
 *     - scalarType {snmp.ObjectType}
 *     - maxAccess {snmp.MaxAccess}
 *     - innerHandler {Function}
 */
function addScalarProvider(registrationInfo)
{
  const           { name, innerHandler } = registrationInfo;
  let             handler;

  // Create the full handler given the inner handler
  handler =
    async (mibRequest) =>
    {
      const           value = await innerHandler(mibRequest);

      mib.setScalarValue(name, value);
      mibRequest.done();
    };

  // Replace the inner handler with the full handler
  registrationInfo.handler = handler;
  delete registrationInfo.innerHandler;

  // Register this new provider
  mib.registerProvider(registrationInfo);

  // Replace the provider of the previously-created node with this one
  mib.addProviderToNode(registrationInfo);
}

function scalarReadCreateHandler(provider)
{
  // If there's a default value specified...
  if (typeof provider.defVal != "undefined")
  {
    // ... then use it
    return provider.defVal;
  }

  // Choose an appropriate default value, when possible
  switch(provider.scalarType)
  {
  case snmp.ObjectType.Boolean :
    return false;

  case snmp.ObjectType.Integer :
    return 0;

  case snmp.ObjectType.OctetString :
    return "";

  case snmp.ObjectType.OID :
    return "0.0";

  case snmp.ObjectType.Counter :
  case snmp.ObjectType.Counter64 :
    return 0;

  default :
    console.log("No default scalar value available:", provider);
    return undefined;
  }
}

function tableRowStatusHandler(provider, action, row)
{
  const           tc = provider.tableColumns;
  const           RowStatus = snmp.RowStatus;

  function defVal(col, valueIfNotFound)
  {
    if (typeof tc[col].defVal == "undefined")
    {
      return valueIfNotFound;
    }

    return tc[col].defVal;
  }

  switch(provider.name)
  {
  case "rsuSRMStatusEntry" :
    // rsuSRMIndex             RsuTableIndex,
    // rsuSRMPsid              RsuPsidTC,
    // rsuSRMDsrcMsgId         Integer32,
    // rsuSRMTxMode            INTEGER,
    // rsuSRMTxChannel         Integer32,
    // rsuSRMTxInterval        Integer32,
    // rsuSRMDeliveryStart     OCTET STRING,
    // rsuSRMDeliveryStop      OCTET STRING,
    // rsuSRMPayload           OCTET STRING,
    // rsuSRMEnable            INTEGER,
    // rsuSRMStatus            RowStatus
    return (
      [
        Array.isArray(row) ? row[0] : row,
        defVal(1, "1234"),
        defVal(2, 18),
        defVal(3, 1),
        defVal(4, 172),
        defVal(5, 1000),
        defVal(6, "07e10a071722"),
        defVal(7, ""),
        defVal(8, "hello world"),
        defVal(9, 1),
        (action == "createAndGo"
         ? RowStatus["active"]
         : RowStatus["notInService"])
      ]);

  case "rsuIFMStatusEntry" :
    // rsuIFMIndex             RsuTableIndex,
    // rsuIFMPsid              RsuPsidTC,
    // rsuIFMDsrcMsgId         Integer32,
    // rsuIFMTxMode            INTEGER,
    // rsuIFMTxChannel         Integer32,
    // rsuIFMEnable            INTEGER,
    // rsuIFMStatus            RowStatus
    return (
      [
        Array.isArray(row) ? row[0] : row,
        defVal(1, "1234"),
        defVal(2, 18),
        defVal(3, 1),
        defVal(4, 172),
        defVal(5, 1),
        (action == "createAndGo"
         ? RowStatus["active"]
         : RowStatus["notInService"])
      ]);

  case "rsuDsrcForwardEntry" :
    // rsuDsrcFwdIndex              RsuTableIndex,
    // rsuDsrcFwdPsid               RsuPsidTC,
    // rsuDsrcFwdDestIpAddr         Ipv6Address,
    // rsuDsrcFwdDestPort           Integer32,
    // rsuDsrcFwdProtocol           INTEGER,
    // rsuDsrcFwdRssi               Integer32,
    // rsuDsrcFwdMsgInterval        Integer32,
    // rsuDsrcFwdDeliveryStart      OCTET STRING,
    // rsuDsrcFwdDeliveryStop       OCTET STRING,
    // rsuDsrcFwdEnable             INTEGER,
    // rsuDsrcFwdStatus             RowStatus
    return (
      [
        Array.isArray(row) ? row[0] : row,
        defVal(1, "1234"),
        defVal(2, "20010333002200EF0000000000000001"),
        defVal(3, 1024),
        defVal(4, 1),
        defVal(5, -80),
        defVal(6, 3),
        defVal(7, ""),
        defVal(8, ""),
        defVal(9, 1),
        (action == "createAndGo"
         ? RowStatus["active"]
         : RowStatus["notInService"])
      ]);

  case "rsuInterfaceLogEntry" :
    // rsuIfaceLogIndex             RsuTableIndex,
    // rsuIfaceGenerate             INTEGER,
    // rsuIfaceMaxFileSize          Integer32,
    // rsuIfaceMaxFileTime          Integer32,
    // rsuIfaceLogByDir             INTEGER,
    // rsuIfaceName                 DisplayString
    return (
      [
        Array.isArray(row) ? row[0] : row,
        defVal(1, 1),
        defVal(2, 15),
        defVal(3, 2),
        defVal(4, 1),
        defVal(5, "eth0")
      ]);

  case "rsuDsrcChannelModeEntry" :
    // rsuDCMIndex       RsuTableIndex,
    // rsuDCMRadio       DisplayString,
    // rsuDCMMode        INTEGER,
    // rsuDCMCCH         Integer32,
    // rsuDCMSCH         Integer32
    return (
      [
        Array.isArray(row) ? row[0] : row,
        defVal(1, "radio1"),
        defVal(2, 1),
        defVal(3, 172),
        defVal(4, 173)
      ]);

  case "rsuWsaServiceEntry" :
    // rsuWsaIndex                 RsuTableIndex,
    // rsuWsaPsid                  RsuPsidTC,
    // rsuWsaPriority              Integer32,
    // rsuWsaProviderContext       OCTET STRING,
    // rsuWsaIpAddress             Ipv6Address,
    // rsuWsaPort                  Integer32,
    // rsuWsaChannel               Integer32,
    // rsuWsaStatus                RowStatus
    return (
      [
        Array.isArray(row) ? row[0] : row,
        defVal(1, "1234"),
        defVal(2, 4),
        defVal(3, ""),
        defVal(4, "20010333002200EF0000000000000001"),
        defVal(5, 1024),
        defVal(6, 172),
        (action == "createAndGo"
         ? RowStatus["active"]
         : RowStatus["notInService"])
      ]);

  case "rsuMessageCountsByPsidEntry" :
    // rsuMessageCountsByPsidIndex        RsuTableIndex,
    // rsuMessageCountsByPsidId           RsuPsidTC,
    // rsuMessageCountsByPsidCounts       Counter32,
    // rsuMessageCountsByPsidRowStatus    RowStatus
    return (
      [
        Array.isArray(row) ? row[0] : row,
        defVal(1, "1234"),
        defVal(2, 0),
        (action == "createAndGo"
         ? RowStatus["active"]
         : RowStatus["notInService"])
      ]);

  case "rsuSetSlaveEntry" :
    // rsuSetSlaveIndex            RsuTableIndex,
    // rsuSetSlaveIpAddress        Ipv6Address,
    // rsuSetSlaveRowStatus        RowStatus
    return (
      [
        Array.isArray(row) ? row[0] : row,
        defVal(1, "20010333002200EF0000000000000001"),
        (action == "createAndGo"
         ? RowStatus["active"]
         : RowStatus["notInService"])
      ]);

  default :
    return undefined;
  }
}


// DO IT, BABY!
main();
