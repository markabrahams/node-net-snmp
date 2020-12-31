let             snmp;
let             mib;
let             agent;
let             store;
let             authorizer;

Promise.resolve()
  .then(
    () =>
    {
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
    })
  .then(
    () =>
    {
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

          // Register the providers
          agent.getMib().registerProviders(providers);
        });
    })
  .then(
    () =>
    {
      // Add providers for each of our dynamic values
      addDynamicProviders();
    })
  .then(
    () =>
    {
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

      mib.setScalarValue("rsuSysObjectID", "1.0.15628.4.1.6");

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
    });


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
