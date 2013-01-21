
# net-snmp - [homepage][homepage]

This module implements version 1 and 2c of the [Simple Network Management
Protocol (SNMP)][SNMP].

This module is installed using [Node Package Manager (NPM)][NPM]:

    npm install net-snmp

It is loaded using the `require()` function:

    var snmp = require ("net-snmp");

Sessions to remote hosts can then be created and used to perform SNMP requests
and send SNMP traps or informs:

    var session = snmp.createSession ("127.0.0.1", "public");

    var oids = ["1.3.6.1.2.1.1.5.0", "1.3.6.1.2.1.1.6.0"];
    
    session.get (oids, function (error, varbinds) {
        if (error) {
            console.error (error);
        } else {
            for (var i = 0; i < varbinds.length; i++)
                if (snmp.isVarbindError (varbinds[i])
                    console.error (snmp.varbindError (varbinds[i])
                else
                    console.log (varbinds[i].oid + " = " + varbinds[i].value);
        }
    });

    session.trap (snmp.TrapType.LinkDown, function (error) {
        if (error)
            console.error (error);
    });

[homepage]: http://re-tool.org "Homepage"
[SNMP]: http://en.wikipedia.org/wiki/Simple_Network_Management_Protocol "SNMP"
[NPM]: https://npmjs.org/ "NPM"

# RFC & Standards Compliance

This module aims to be fully compliant with the following RFCs:

 * [1065][1065] - Structure and Identification of Management Information
 * [1067][1067] - A Simple Network Management Protocol (version 1)
 * [2578][2578] - Structure of Management Information Version 2 (SMIv2)
 * [3416][3416] - Simple Network Management Protocol (SNMP) (version 2c)

However, this module does not implement or export any method to help implement
the report request type.

[1065]: https://tools.ietf.org/rfc/rfc1065.txt "RFC 1065"
[1067]: https://tools.ietf.org/rfc/rfc1067.txt "RFC 1067"
[2578]: https://tools.ietf.org/rfc/rfc2578.txt "RFC 2578"
[3416]: https://tools.ietf.org/rfc/rfc3416.txt "RFC 3416"

# Constants

The following sections describe constants exported and used by this module.

## snmp.Version1 & snmp.Version2c

These constants are used to specify which of the two versions supported by
this module should be used.

## snmp.ErrorStatus

This object contains constants for all valid values the error-status field in
response PDUs can hold.  If when parsing a PDU the error-index field contains
a value not defined in this object the constant `snmp.ErrorStatus.GeneralError`
will be used instead of the value of the error-status field.  The following
constants are defined in this object:

 * `NoError`
 * `TooBig`
 * `NoSuchName`
 * `BadValue`
 * `ReadOnly`
 * `GeneralError`
 * `NoAccess`
 * `WrongType`
 * `WrongLength`
 * `WrongEncoding`
 * `WrongValue`
 * `NoCreation`
 * `InconsistentValue`
 * `ResourceUnavailable`
 * `CommitFailed`
 * `UndoFailed`
 * `AuthorizationError`
 * `NotWritable`
 * `InconsistentName`

## snmp.ObjectType

This object contains constants used to specify syntax for varbind objects,
e.g.:

    var varbind = {
        oid: "1.3.6.1.2.1.1.4.0",
        type: snmp.ObjectType.OctetString,
        value: "user.name@domain.name"
    };

The following constants are defined in this object:

 * `Boolean`
 * `Integer`
 * `OctetString`
 * `Null`
 * `OID`
 * `IpAddress`
 * `Counter`
 * `Gauge`
 * `TimeTicks`
 * `Opaque`
 * `Integer32`
 * `Counter32`
 * `Gauge32`
 * `Unsigned32`
 * `Counter64`
 * `NoSuchObject`
 * `NoSuchInstance`
 * `EndOfMibView`

## snmp.TrapType

This object contains constants used to specify a type of SNMP trap.  These
constants are passed to the `trap()` and `inform()` methods exposed by the
`Session` class.  The following constants are defined in this object:

 * `ColdStart`
 * `WarmStart`
 * `LinkDown`
 * `LinkUp`
 * `AuthenticationFailure`
 * `EgpNeighborLoss`
 * `EnterpriseSpecific`

# OID Strings & Varbinds

Some parts of this module accept simple OID strings, e.g.:

    var oid = "1.3.6.1.2.1.1.5.0";

Other parts take an OID string, it's type and value.  This is collectively
referred to as a varbind, and is specified as an object, e.g.:

    var varbind = {
        oid: "1.3.6.1.2.1.1.5.0",
        type: snmp.ObjectType.OctetString,
        value: new Buffer ("host1")
    };

The `type` parameter is one of the constants defined in the `snmp.ObjectType`
object.

The JavaScript `true` and `false` keywords are used for the values of varbinds
with type `Boolean`.

All integer based types are specified as expected (this includes `Integer`,
`Counter`, `Gauge`, `TimeTicks`, `Integer32`, `Counter32`, `Gauge32`, and
`Unsigned32`), e.g. `-128` or `100`.

Since JavaScript does not offer full 64 bit integer support objects with type
`Counter64` cannot be supported in the same way as other integer types,
instead [Node.js][nodejs] `Buffer` objects are used.  Users are responsible for
producing (i.e. for `set()` requests) and consuming (i.e. the varbinds passed
to callback functions) `Buffer` objects.  That is, this module does no work
with 64 bit integers, it simply treats them as opaque `Buffer` objects.

Dotted decimal strings are used for the values of varbinds with type `OID`,
e.g. `1.3.6.1.2.1.1.5.0`.

Dotted quad formatted strings are used for the values of varbinds with type
`IpAddress`, e.g. `192.168.1.1`.

[Node.js][nodejs] `Buffer` objects are used for the values of varbinds with
type `Opaque` and `OctetString`.  For varbinds with type `OctetString` this
module will accept JavaScript strings, but will always give back `Buffer`
objects.

The `NoSuchObject`, `NoSuchInstance` and `EndOfMibView` types are used to
indicate an error condition.  Currently there is no reason for users of this
module to to build varbinds using these types.

[nodejs]: http://nodejs.org "Node.js"

# Callback Functions & Error Handling

Most of the request methods exposed by this module require a mandatory
callback function.  This function is called once a request has been processed.
This could be because an error occurred when processing the request, a trap
has been dispatched or a successful response was received.

The first parameter to every callback is an error object.  In the case no
error occurred this parameter will be "null" indicating no error, e.g.:

    function responseCb (error, varbinds) {
        if (error) {
            console.error (error);
        } else {
            // no error, do something with varbinds
        }
    }

When defined, the error parameter is always an instance of the Error class, or
a sub-class described in one of the sub-sections contained in this section.

The semantics of error handling is slightly different between SNMP version
1 and 2c.  In SNMP version 1 if an error occurs when calculating the value for
one OID the request as a whole will fail, i.e. no OIDs will have a value.

This failure manifests itself within the error-status and error-index fields
of the response.  When the error-status field in the response is non-zero,
i.e. not `snmp.ErrorStatus.NoError` the `callback` will be called with `error`
defined detailing the error.

Requests made with SNMP version 1 can simply assume all OIDs have a value when
no error object is passed to the `callback`, i.e.:

    var oids = ["1.3.6.1.2.1.1.5.0", "1.3.6.1.2.1.1.6.0"];
    
    session.get (oids, function (error, varbinds) {
        if (error) {
            console.error (error.toString ());
        } else {
            var sysName = varbinds[0].value; // this WILL have a value
        }
    });

In SNMP version 2c instead of using the error-status and error-index fields of
the response to signal an error, the value for the varbind placed in the
response for an OID will have an object syntax describing an error.  The
error-status and error-index fields of the response will indicate the request
was successul, i.e. `snmp.ErrorStatus.NoError`.

This changes the way in which error checking is performed in the `callback`.
When using SNMP version 2c each varbind must be checked to see if its value
was computed and returned successfully:

    var oids = ["1.3.6.1.2.1.1.5.0", "1.3.6.1.2.1.1.6.0"];
    
    session.get (oids, function (error, varbinds) {
        if (error) {
            console.error (error.toString ());
        } else {
            if (varbinds[0].type != snmp.ErrorStatus.NoSuchObject
                    && varbinds[0].type != snmp.ErrorStatus.NoSuchInstance
                    && varbinds[0].type != snmp.ErrorStatus.EndOfMibView) {
                var sysName = varbinds[0].value;
            } else {
                console.error (snmp.ObjectType[varbinds[0].type] + ": "
                        + varbinds[0].oid);
            }
        }
    });

This module exports two functions and promotes a specifc pattern to make error
checking a little simpler.  Firstly, regardless of version in use varbinds can
always be checked.  This results in a generic `callback` that can be used for
both versions.

The `isVarbindError()` function can be used to determine if a varbind has an
error condition.  This function takes a single `varbind` parameter and returns
`true` if the varbind has an error condition, otherwise `false`.  The exported
`varbindError()` function can then be used to obtain the error string
describing the error, which will include the OID for the varbind:

    session.get (oids, function (error, varbinds) {
        if (error) {
            console.error (error.toString ());
        } else {
            if (snmp.isVarbindError (varbinds[0])) {
                console.error (snmp.varbindError (varbinds[0]));
            } else {
                var sysName = varbinds[0].value;
            }
        }
    });

If the `varbindError` function is called with a varbind for which
`isVarbindError` would return false, the string `NotAnError` will be returned
appended with the related OID.

The sections following defines the error classes used by this module.

## snmp.RequestFailedError

This error indicates a remote host failed to process a request.  The exposed
`message` attribute will contain a detailed error message.  This error also
exposes a `status` attribute which contains the error-index value from a
response.  This will be one of the constants defined in the
`snmp.ErrorStatus` object.

## snmp.RequestInvalidError

This error indicates a failure to render a request message before it could be
sent.  The error can also indicate that a parameter provided was invalid.
The exposed `message` attribute will contain a detailed error message.

## snmp.RequestTimedOutError

This error states that no response was received for a particular request.  The
exposed `message` attribute will contain the value `Request timed out`.

## snmp.ResponseInvalidError

This error indicates a failure to parse a response message.  The exposed
`message` attribute will contain a detailed error message.

# Using This Module

All SNMP requests are made using an instance of the `Session` class.  This
module exports the `createSession()` function which is used to create
instances of the `Session` class.

## snmp.createSession ([target], [community], [options])

The `createSession()` function instantiates and returns an instance of the
`Session` class:

    var options = {
        version: snmp.Version1,
        retries: 1,
        timeout: 5000,
        port: 161,
        trapPort: 162
    };
    
    var session = snmp.createSession ("127.0.0.1", "public", options);

The optional `target` parameter defaults to `127.0.0.1`.  The optional
`community` parameter defaults to `public`.  The optional `options` parameter
is an object, and can contain the following items:

 * `version` - Either `snmp.Version1` or `snmp.Version2c`, defaults to
   `snmp.Version1`
 * `retries` - Number of times to re-send a request, defaults to `1`
 * `timeout` - Number of milliseconds to wait for a response before re-trying
   or failing, defaults to `5000`
 * `port` - UDP port to send requests too, defaults to `161`
 * `trapPort` - UDP port to send traps and informs too, defaults to `162`

## session.get (oids, callback)

The `get()` method fetches the value for one or more OIDs from a remote host.

The `oids` parameter is an array of OID strings.  The `callback` function is
called once the request is complete.  The following arguments will be passed
to the `callback` function:

 * `error` - Instance of the Error class or a sub-class, or `null` if no error
   occurred
 * `varbinds` - Array of varbinds, will not be provided if an error occurred

The varbind in position N in the `varbinds` array will correspond to the OID
in position N in the `oids` array in the request.

Each varbind must be checked for an error condition using the
`snmp.isVarbindError()` function when using SNMP version 2c.

The following example fetches values for the sysName (`1.3.6.1.2.1.1.5.0`) and
sysLocation (`1.3.6.1.2.1.1.6.0`) OIDs:

    var oids = ["1.3.6.1.2.1.1.5.0", "1.3.6.1.2.1.1.6.0"];
    
    session.get (oids, function (error, varbinds) {
        if (error) {
            console.error (error.toString ());
        } else {
            for (var i = 0; i < varbinds.length; i++) {
                // for version 1 we can assume all OIDs were successful
                console.log (varbinds[i].oid + "|" + varbinds[i].value);
            
                // for version 2c we must check each OID for an error condition
                if (snmp.isVarbindError (varbinds[i]))
                    console.error (snmp.varbindError (varbinds[i]));
                else
                    console.log (varbinds[i].oid + "|" + varbinds[i].value);
            }
        }
    });

## session.getNext (oids, callback)

The `getNext()` method fetches the value for the OIDs lexicographically
following one or more OIDs in the MIB tree from a remote host.

The `oids` parameter is an array of OID strings.  The `callback` function is
called once the request is complete.  The following arguments will be passed
to the `callback` function:

 * `error` - Instance of the Error class or a sub-class, or `null` if no error
   occurred
 * `varbinds` - Array of varbinds, will not be provided if an error occurred

The varbind in position N in the `varbinds` array will correspond to the OID
in position N in the `oids` array in the request.

Each varbind must be checked for an error condition using the
`snmp.isVarbindError()` function when using SNMP version 2c.

The following example fetches values for the next OIDs following the
sysObjectID (`1.3.6.1.2.1.1.1.0`) and sysName (`1.3.6.1.2.1.1.4.0`) OIDs:

    var oids = [
        "1.3.6.1.2.1.1.1.0",
        "1.3.6.1.2.1.1.4.0"
    ];
    
    session.getNext (oids, function (error, varbinds) {
        if (error) {
            console.error (error.toString ());
        } else {
            for (var i = 0; i < varbinds.length; i++) {
                // for version 1 we can assume all OIDs were successful
                console.log (varbinds[i].oid + "|" + varbinds[i].value);
            
                // for version 2c we must check each OID for an error condition
                if (snmp.isVarbindError (varbinds[i]))
                    console.error (snmp.varbindError (varbinds[i]));
                else
                    console.log (varbinds[i].oid + "|" + varbinds[i].value);
            }
        }
    });

## session.getBulk (oids, [nonRepeaters], [maxRepetitions], callback)

The `getBulk()` method fetches the value for the OIDs lexicographically
following one or more OIDs in the MIB tree from a remote host.

The `oids` parameter is an array of OID strings.  The optional `nonRepeaters`
parameter specifies the number of OIDs in the `oids` parameter for which only
1 varbind should be returned, and defaults to `0`.  For each remaining OID
in the `oids` parameter the optional `maxRepetitions` parameter specifies how
many OIDs lexicographically following an OID for which varbinds should be
fetched, and defaults to `20`.

The `callback` function is called once the request is complete.  The following
arguments will be passed to the `callback` function:

 * `error` - Instance of the Error class or a sub-class, or `null` if no error
   occurred
 * `varbinds` - Array of varbinds, will not be provided if an error occurred

The varbind in position N in the `varbinds` array will correspond to the OID
in position N in the `oids` array in the request.

For for the first `nonRepeaters` items in `varbinds` each item will be a
single varbind.  For all remaining items in `varbinds` each item will be an
array of varbinds - this makes it easy to tie response varbinds with requested
OIDs since response varbinds are grouped and placed in the same position in
`varbinds`.

Each varbind must be checked for an error condition using the
`snmp.isVarbindError()` function when using SNMP version 2c.

The following example fetches values for the OIDs following the sysContact
(`1.3.6.1.2.1.1.4.0`) and sysName (`1.3.6.1.2.1.1.5.0`) OIDs, and up to the
first 20 OIDs in the ifDescr (`1.3.6.1.2.1.2.2.1.2`) and ifType
(`1.3.6.1.2.1.2.2.1.3`) columns from the ifTable (`1.3.6.1.2.1.2.2`) table:

    var oids = [
        "1.3.6.1.2.1.1.4.0",
        "1.3.6.1.2.1.1.5.0",
        "1.3.6.1.2.1.2.2.1.2",
        "1.3.6.1.2.1.2.2.1.3"
    ];
    
    var nonRepeaters = 2;
    
    session.getNext (oids, nonRepeaters, function (error, varbinds) {
        if (error) {
            console.error (error.toString ());
        } else {
            // step through the non-repeaters which are single varbinds
            for (var i = 0; i < nonRepeaters; i++) {
                if (i >= varbinds.length)
                    break;

                if (snmp.isVarbindError (varbinds[i]))
                    console.error (snmp.varbindError (varbinds[i]));
                else
                    console.log (varbinds[i].oid + "|" + varbinds[i].value);
            }

            // then step through the repeaters which are varbind arrays
            for (var i = nonRepeaters; i < varbinds.length; i++) {
                for (var j = 0; j < varbinds[i].length; j++) {
                    if (snmp.isVarbindError (varbinds[i][j]))
                        console.error (snmp.varbindError (varbinds[i][j]));
                    else
                        console.log (varbinds[i][j].oid + "|"
                        		+ varbinds[i][j].value);
                }
        }
    });

## session.set (varbinds, callback)

The `set()` method sets the value of one or more OIDs on a remote host.

The `varbinds` parameter is an array of varbind objects. The `callback`
function is called once the request is complete.  The following arguments will
be passed to the `callback` function:

 * `error` - Instance of the Error class or a sub-class, or `null` if no error
   occurred
 * `varbinds` - Array of varbinds, will not be provided if an error occurred

The varbind in position N in the `varbinds` array will correspond to the
varbind in position N in the `varbinds` array in the request.  The remote host
should echo back varbinds and their values as specified in the request unless
an error occurred.  The `varbinds` array will contain each varbind as sent
back by the remote host.

Each varbind must be checked for an error condition using the
`snmp.isVarbindError()` function when using SNMP version 2c.

The following example sets the value of the sysName (`1.3.6.1.2.1.1.4.0`) and
sysLocation (`1.3.6.1.2.1.1.6.0`) OIDs:

    var varbinds = [
        {
            oid: "1.3.6.1.2.1.1.5.0",
            type: snmp.ObjectType.OctetString,
            value: "host1"
        }, {
            oid: "1.3.6.1.2.1.1.6.0",
            type: snmp.ObjectType.OctetString,
            value: "somewhere"
        }
    ];
    
    session.set (varbinds, function (error, varbinds) {
        if (error) {
            console.error (error.toString ());
        } else {
            for (var i = 0; i < varbinds.length; i++) {
                // for version 1 we can assume all OIDs were successful
                console.log (varbinds[i].oid + "|" + varbinds[i].value);
            
                // for version 2c we must check each OID for an error condition
                if (snmp.isVarbindError (varbinds[i]))
                    console.error (snmp.varbindError (varbinds[i]));
                else
                    console.log (varbinds[i].oid + "|" + varbinds[i].value);
            }
        }
    });

## session.trap (typeOrOid, [varbinds], [agentAddr], callback)

The `trap()` method sends a SNMP trap to a remote host.

The `typeOrOid` parameter can be one of two types; one of the constants
defined in the `snmp.TrapType` object (excluding the
`snmp.TrapType.EnterpriseSpecific` constant), or an OID string.

For SNMP version 1 when a constant is specified the following fields are set in
the trap:

 * The enterprise field is set to the OID `1.3.6.1.4.1`
 * The generic-trap field is set to the constant specified
 * The specific-trap field is set to 0

When an OID string is specified the following fields are set in the trap:

 * The final decimal is stripped from the OID string and set in the
   specific-trap field
 * The remaining OID string is set in the enterprise field
 * The generic-trap field is set to the constant
   `snmp.TrapType.EnterpriseSpecific`

In both cases the time-stamp field in the trap PDU is set to the value
returned by the `process.uptime ()` function multiplied by `100`.

SNMP version 2c messages are quite different in comparison with version 1.
The version 2c trap has a much simpler format, simply a sequence of varbinds.
The first varbind to be placed in the trap message will be for the
`sysUptime.0` OID (`1.3.6.1.6.3.1.1.4.1.0`).  The value for this varbind will
be the value returned by the `process.uptime ()` function multiplied by 100.
This will be followed by a second varbind for the `snmpTrapOID.0` OID
(`1.3.6.1.6.3.1.1.4.1.0`).  The value for this will depend on the `typeOrOid`
parameter.  If a constant is specified the trap OID for the constant
will be used as supplied for the varbinds value, otherwise the OID string
specified will be used as is for the value of the varbind.

The optional `varbinds` parameter is an array of varbinds to include in the
trap, and defaults to the empty array `[]`.

The optional `agentAddr` parameter is the IP address used to populate the
agent-addr field for SNMP version 1 type traps, and defaults to `127.0.0.1`.
When using SNMP version 2c the `agentAddr` parameter is ignored if specified
since version 2c trap messages do not have an agent-addr field.

The `callback` function is called once the trap has been sent, or an error
occurred.  The following arguments will be passed to the `callback` function:

 * `error` - Instance of the Error class or a sub-class, or `null` if no error
   occurred

The following example sends an enterprise specific trap to a remote host using
a SNMP version 1 trap, and includes the sysName (`1.3.6.1.2.1.1.5.0`) varbind
in the trap.  Before the trap is sent the `agentAddr` field is calculated using
DNS to resolve the hostname of the local host:

    var enterpriseOid = "1.3.6.1.4.1.2000.1"; // made up, but it may be valid
    
    var varbinds = [
        {
            oid: "1.3.6.1.2.1.1.5.0",
            type: snmp.Type.OctetString,
            value: "host1"
        }
    ];
    
    dns.lookup (os.hostname (), function (error, agentAddress) {
        if (error) {
            console.error (error);
        } else {
            session.trap (enterpriseOid, varbinds, agentAddress,
                    function (error) {
                if (error)
                    console.error (error);
            });
        }
    });

The following example sends a generic link-down trap to a remote host using a
SNMP version 1 trap, it does not include any varbinds or specify the
`agentAddr` parameter:

    session.trap (snmp.TrapType.LinkDown, function (error) {
        if (error)
            console.error (error);
    });

The following example sends an enterprise specific trap to a remote host using
a SNMP version 2c trap, and includes two enterprise specific varbinds:

    var trapOid = "1.3.6.1.4.1.2000.1";
    
    var varbinds = [
        {
            oid: "1.3.6.1.4.1.2000.2",
            type: snmp.Type.OctetString,
            value: "Hardware health status changed"
        },
        {
            oid: "1.3.6.1.4.1.2000.3",
            type: snmp.Type.OctetString,
            value: "status-error"
        }
    ];
    
    // version 2c should have been specified when creating the session
    session.trap (trapOid, varbinds, function (error) {
        if (error)
            console.error (error);
    });

## session.inform (typeOrOid, [varbinds], callback)

The `inform()` method sends a SNMP inform to a remote host.

The `typeOrOid` parameter can be one of two types; one of the constants
defined in the `snmp.TrapType` object (excluding the
`snmp.TrapType.EnterpriseSpecific` constant), or an OID string.

The first varbind to be placed in the request message will be for the
`sysUptime.0` OID (`1.3.6.1.6.3.1.1.4.1.0`).  The value for this varbind will
be the value returned by the `process.uptime ()` function multiplied by 100.
This will be followed by a second varbind for the `snmpTrapOID.0` OID
(`1.3.6.1.6.3.1.1.4.1.0`).  The value for this will depend on the `typeOrOid`
parameter. If a constant is specified the trap OID for the constant will be
used as supplied for the varbinds value, otherwise the OID string specified
will be used as is for the value of the varbind.

The optional `varbinds` parameter is an array of varbinds to include in the
inform request, and defaults to the empty array `[]`.

The `callback` function is called once the trap has been sent, or an error
occurred.  The following arguments will be passed to the `callback` function:

 * `error` - Instance of the Error class or a sub-class, or `null` if no error
   occurred
 * `varbinds` - Array of varbinds, will not be provided if an error occurred

The varbind in position N in the `varbinds` array will correspond to the
varbind in position N in the `varbinds` array in the request.  The remote host
should echo back varbinds and their values as specified in the request, and
the `varbinds` array will contain each varbind as sent back by the remote host.

Normally there is no reason to use the contents of the `varbinds` parameter
since the varbinds are as they were sent in the request.

The following example sends a generic cold-start inform to a remote host,
it does not include any varbinds:

    session.inform (snmp.TrapType.ColdStart, function (error) {
        if (error)
            console.error (error);
    });

The following example sends an enterprise specific inform to a remote host,
and includes two enterprise specific varbinds:

    var informOid = "1.3.6.1.4.1.2000.1";
    
    var varbinds = [
        {
            oid: "1.3.6.1.4.1.2000.2",
            type: snmp.Type.OctetString,
            value: "Periodic hardware self-check"
        },
        {
            oid: "1.3.6.1.4.1.2000.3",
            type: snmp.Type.OctetString,
            value: "hardware-ok"
        }
    ];
    
    session.inform (informOid, varbinds, function (error) {
        if (error)
            console.error (error);
    });

## session.walk (oids, callback)

This `walk()` method is not actually implemented by this module.  The main
reason being that the semantics of the callback function when more than one
OID is specified in the request is ambiguous.

Instead an example implementation which supports walking a single OID using
both SNMP version 1 and 2c is provided, with comments:

    var oid = "1.3.6.1";
    
    function responseCb (error, varbinds) {
        if (error) {
            // When we reach the end of the MIB view the remote host will
            // respond with the error-index field set to NoSuchName, this
            // will be passed to this callback as a RequestFailedError with
            // status set to the constant snmp.ErrorStatus.NoSuchName, this
            // indicates we can stop performing get-next-requests, this will
            // work for version 1 only, for version 2c we will end the walk by
            // looking for a varbind with a value of type
            // `snmp.ObjectType.EndOfMibView` which will be checked later:
            if (error instanceof snmp.RequestFailedError) {
                if (error.status != snmp.ErrorStatus.NoSuchName) {
                    console.error (error.toString ());
                }
            } else {
                console.error (error.toString ());
            }
        } else {
            var oids;
            if (session.version == snmp.Version2c) {
                // Use the last varbind returned to work out which OID to
                // specify in the next get-bulk-request, remember the
                // semantics of the getBulk() callback, our first and only
                // varbind item will be an array of varbinds:
                if (! snmp.isVarbindError (varbinds[0][varbinds[0].length - 0]))
                    oids = varbinds[0][varbinds[0].length - 0].oid;
                
                for (var i = 0; i < varbinds[0].length; i++) {
                    console.log (varbinds[0][i].oid + "|" + varbinds[0][i].type
                            + "|" + varbinds[0][i].value);
                }
            } else {
                // Use the only varbind returned to work out which OID to
                // specify in the next get-next-request:
                oids = [varbinds[0].oid];
                
                console.log (varbinds[0].oid + "|" + varbinds[0].type + "|"
                        + varbinds[0].value);
            }
        }
        
        walk (oids, cb);
    }
    
    function walk (version, oids, responseCb) {
        // We only support a single OID so the first call to this function will
        // be performed using an OID string, the getNext() and getBulk()
        // methods want an arrays so we'll implicitly convert it here for the
        // initial request, all other requests made by the responseCb()
        // callback above will be performed using OID arrays
        if (typeof oids == "string")
            oids = [oids];
        if (session.version == snmp.Version2c)
            session.getBulk (oids, 0, 20, responseCb);
        else
            session.getNext (oids, responseCb);
    }
    
    walk (oid, responseCb);

# Example Programs

Example programs are included under the modules `example` directory.

# Bugs & Known Issues

None, yet!

Please report bugs to <stephen.vickers.sv@gmail.com>.

# Changes

## Version 1.0.0 - 14/01/2013

 * Initial release including only SNMP version 1 support

## Version 1.1.0 - 20/01/2013

 * Implement SNMP version 2c support

## Version 1.1.1 - 21/01/2013

 * Correct name used in example `require()` call to include this module

# Roadmap

In no particular order:

 * Helper functions (`getTable()`, `getSubtree()`, `walk()`)
 * Extensible SNMP agent
 * SNMP version 3

# License

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU General Public License as published by the Free Software
Foundation, either version 3 of the License, or (at your option) any later
version.

This program is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more
details.

You should have received a copy of the GNU General Public License along with
this program.  If not, see
[http://www.gnu.org/licenses](http://www.gnu.org/licenses).

# Author

Stephen Vickers <stephen.vickers.sv@gmail.com>
