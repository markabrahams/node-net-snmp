
# net-snmp

This module implements version 1 and 2c of the [Simple Network Management
Protocol (SNMP)][SNMP].

This module is installed using [node package manager (npm)][npm]:

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
                if (snmp.isVarbindError (varbinds[i]))
                    console.error (snmp.varbindError (varbinds[i]))
                else
                    console.log (varbinds[i].oid + " = " + varbinds[i].value);
        }

        // If done, close the session
        session.close ();
    });

    session.trap (snmp.TrapType.LinkDown, function (error) {
        if (error)
            console.error (error);
    });

[SNMP]: http://en.wikipedia.org/wiki/Simple_Network_Management_Protocol "SNMP"
[npm]: https://npmjs.org/ "npm"

# Standards Compliance

This module aims to be fully compliant with the following RFCs:

 * [1155][1155] - Structure and Identification of Management Information
 * [1098][1098] - A Simple Network Management Protocol (version 1)
 * [2578][2578] - Structure of Management Information Version 2 (SMIv2)
 * [3416][3416] - Simple Network Management Protocol (SNMP) (version 2c)

However, this module does not implement, or export any method that might help
to implement, the SNMP version 2c report request type.

[1155]: https://tools.ietf.org/rfc/rfc1155.txt "RFC 1155"
[1098]: https://tools.ietf.org/rfc/rfc1098.txt "RFC 1098"
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
will be used instead of the value in the error-status field.  The following
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
to callback functions) `Buffer` objects.  That is, this module does not work
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

When defined, the error parameter is always an instance of the `Error` class,
or a sub-class described in one of the sub-sections contained in this section.

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

    // Default options
    var options = {
        port: 161,
        retries: 1,
        timeout: 5000,
        transport: "udp4",
        trapPort: 162,
        version: snmp.Version1,
        idBitsSize: 16
    };
    
    var session = snmp.createSession ("127.0.0.1", "public", options);

The optional `target` parameter defaults to `127.0.0.1`.  The optional
`community` parameter defaults to `public`.  The optional `options` parameter
is an object, and can contain the following items:

 * `port` - UDP port to send requests too, defaults to `161`
 * `retries` - Number of times to re-send a request, defaults to `1`
 * `sourceAddress` - IP address from which SNMP requests should originate,
   there is no default for this option, the operating system will select an
   appropriate source address when the SNMP request is sent
 * `sourcePort` - UDP port from which SNMP requests should originate, defaults
   to an ephemeral port selected by the operation system
 * `timeout` - Number of milliseconds to wait for a response before re-trying
   or failing, defaults to `5000`
 * `transport` - Specify the transport to use, can be either `udp4` or `udp6`,
   defaults to `udp4`
 * `trapPort` - UDP port to send traps and informs too, defaults to `162`
 * `version` - Either `snmp.Version1` or `snmp.Version2c`, defaults to
   `snmp.Version1`
 * `idBitsSize` - Either `16` or `32`, defaults to `32`.  Used to reduce the size
    of the generated id for compatibility with some older devices.

When a session has been finished with it should be closed:

    session.close ();

## session.on ("close", callback)

The `close` event is emitted by the session when the sessions underlying UDP
socket is closed.

No arguments are passed to the callback.

Before this event is emitted all outstanding requests are cancelled, resulting
in the failure of each outstanding request.  The error passed back through to
each request will be an instance of the `Error` class with the errors
`message` attribute set to `Socket forcibly closed`.

The following example prints a message to the console when a sessions
underlying UDP socket is closed:

    session.on ("close", function () {
        console.log ("socket closed");
    });

## session.on ("error", callback)

The `error` event is emitted by the session when the sessions underlying UDP
socket emits an error.

The following arguments will be passed to the `callback` function:

 * `error` - An instance of the `Error` class, the exposed `message` attribute
   will contain a detailed error message.

The following example prints a message to the console when an error occurs
with a sessions underlying UDP socket, the session is then closed:

    session.on ("error", function (error) {
        console.log (error.toString ());
        session.close ();
    });

## session.close ()

The `close()` method closes the sessions underlying UDP socket.  This will
result in the `close` event being emitted by the sessions underlying UDP
socket which is passed through to the session, resulting in the session also
emitting a `close` event.

The following example closes a sessions underlying UDP socket:

    session.close ();

## session.get (oids, callback)

The `get()` method fetches the value for one or more OIDs.

The `oids` parameter is an array of OID strings.  The `callback` function is
called once the request is complete.  The following arguments will be passed
to the `callback` function:

 * `error` - Instance of the `Error` class or a sub-class, or `null` if no
   error occurred
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

## session.getBulk (oids, [nonRepeaters], [maxRepetitions], callback)

The `getBulk()` method fetches the value for the OIDs lexicographically
following one or more OIDs in the MIB tree.

The `oids` parameter is an array of OID strings.  The optional `nonRepeaters`
parameter specifies the number of OIDs in the `oids` parameter for which only
1 varbind should be returned, and defaults to `0`.  For each remaining OID
in the `oids` parameter the optional `maxRepetitions` parameter specifies how
many OIDs lexicographically following an OID for which varbinds should be
fetched, and defaults to `20`.

The `callback` function is called once the request is complete.  The following
arguments will be passed to the `callback` function:

 * `error` - Instance of the `Error` class or a sub-class, or `null` if no
   error occurred
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

## session.getNext (oids, callback)

The `getNext()` method fetches the value for the OIDs lexicographically
following one or more OIDs in the MIB tree.

The `oids` parameter is an array of OID strings.  The `callback` function is
called once the request is complete.  The following arguments will be passed
to the `callback` function:

 * `error` - Instance of the `Error` class or a sub-class, or `null` if no
   error occurred
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

## session.inform (typeOrOid, [varbinds], [options], callback)

The `inform()` method sends a SNMP inform.

The `typeOrOid` parameter can be one of two types; one of the constants
defined in the `snmp.TrapType` object (excluding the
`snmp.TrapType.EnterpriseSpecific` constant), or an OID string.

The first varbind to be placed in the request message will be for the
`sysUptime.0` OID (`1.3.6.1.6.3.1.1.4.1.0`).  The value for this varbind will
be the value returned by the `process.uptime ()` function multiplied by 100
(this can be overridden by providing `upTime` in the optional `options`
parameter, as documented below).

This will be followed by a second varbind for the `snmpTrapOID.0` OID
(`1.3.6.1.6.3.1.1.4.1.0`).  The value for this will depend on the `typeOrOid`
parameter. If a constant is specified the trap OID for the constant will be
used as supplied for the varbinds value, otherwise the OID string specified
will be used as is for the value of the varbind.

The optional `varbinds` parameter is an array of varbinds to include in the
inform request, and defaults to the empty array `[]`.

The optional `options` parameter is an object, and can contain the following
items:

 * `upTime` - Value of the `sysUptime.0` OID (`1.3.6.1.6.3.1.1.4.1.0`) in the
   inform, defaults to the value returned by the `process.uptime ()` function
   multiplied by 100

The `callback` function is called once a response to the inform request has
been received, or an error occurred.  The following arguments will be passed
to the `callback` function:

 * `error` - Instance of the `Error` class or a sub-class, or `null` if no
   error occurred
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
            type: snmp.ObjectType.OctetString,
            value: "Periodic hardware self-check"
        },
        {
            oid: "1.3.6.1.4.1.2000.3",
            type: snmp.ObjectType.OctetString,
            value: "hardware-ok"
        }
    ];
    
    // Override sysUpTime, specfiying it as 10 seconds...
    var options = {upTime: 1000};
    session.inform (informOid, varbinds, options, function (error) {
        if (error)
            console.error (error);
    });

## session.set (varbinds, callback)

The `set()` method sets the value of one or more OIDs.

The `varbinds` parameter is an array of varbind objects. The `callback`
function is called once the request is complete.  The following arguments will
be passed to the `callback` function:

 * `error` - Instance of the `Error` class or a sub-class, or `null` if no
   error occurred
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

## session.subtree (oid, [maxRepetitions], feedCallback, doneCallback)

The `subtree()` method fetches the value for all OIDs lexicographically
following a specified OID in the MIB tree which have the specified OID as
there base.  For example, the OIDs sysName (`1.3.6.1.2.1.1.5.0`) and
sysLocation (`1.3.6.1.2.1.1.6.0`) both have the same base system
(`1.3.6.1.2.1.1`) OID.

For SNMP version 1 repeated `get()` calls are made until the one of the
returned OIDs does not use the specified OID as its base.  For SNMP version
2c repeated `getBulk()` calls are made until the one of the returned OIDs
does no used the specified OID as its base.

The `oid` parameter is an OID string.  The optional `maxRepetitions` parameter
is passed to `getBulk()` requests when SNMP version 2c is being used.

This method will not call a single callback once all OID values are fetched.
Instead the `feedCallback` function will be called each time a response is
received from the remote host.  The following arguments will be passed to the
`feedCallback` function:

 * `varbinds` - Array of varbinds, and will contain at least one varbind

Each varbind must be checked for an error condition using the
`snmp.isVarbindError()` function when using SNMP version 2c.

Once at least one of the returned OIDs does not use the specified OID as its
base, or an error has occurred, the `doneCallback` function will be called.
The following arguments will be passed to the `doneCallback` function:

 * `error` - Instance of the `Error` class or a sub-class, or `null` if no
   error occurred

Once the `doneCallback` function has been called the request is complete and
the `feedCallback` function will no longer be called.

If the `feedCallback` function returns a `true` value when called no more
`get()` or `getBulk()` method calls will be made and the `doneCallback` will
be called.

The following example fetches all OIDS under the system (`1.3.6.1.2.1.1`) OID:

    var oid = "1.3.6.1.2.1.1";
    
    function doneCb (error) {
        if (error)
            console.error (error.toString ());
    }
    
    function feedCb (varbinds) {
        for (var i = 0; i < varbinds.length; i++) {
            if (snmp.isVarbindError (varbinds[i]))
                console.error (snmp.varbindError (varbinds[i]));
            else
                console.log (varbinds[i].oid + "|" + varbinds[i].value);
        }
    }
    
    var maxRepetitions = 20;
    
    // The maxRepetitions argument is optional, and will be ignored unless using
    // SNMP verison 2c
    session.subtree (oid, maxRepetitions, feedCb, doneCb);

## session.table (oid, [maxRepetitions], callback)

The `table()` method fetches the value for all OIDs lexicographically
following a specified OID in the MIB tree which have the specified OID as
there base, much like the `subtree()` method.

This method is designed to fetch conceptial tables, for example the ifTable
(`1.3.6.1.2.1.2.2`) table.  The values for returned varbinds will be structured
into objects to represent conceptual rows.  Each row is then placed into an
object with the rows index being the key, e.g.:

    var table = {
        // Rows keyed by ifIndex (1 and 2 are shown)
        1: {
            // ifDescr (column 2) and ifType (columnd 3) are shown
            2: "interface-1",
            3: 6,
            ...
        },
        2: {
            2: "interface-2",
            3: 6,
            ...
        },
        ...
    }

Internally this method calls the `subtree()` method to obtain the subtree of
the specified table.

The `oid` parameter is an OID string.  If an OID string is passed which does
not represent a table the resulting object produced to hold table data will be
empty, i.e. it will contain no indexes and rows.  The optional
`maxRepetitions` parameter is passed to the `subtree()` request.

The `callback` function will be called once the entire table has been fetched.
The following arguments will be passed to the `callback` function:

 * `error` - Instance of the `Error` class or a sub-class, or `null` if no
   error occurred
 * `table` - Object containing object references representing conceptual
   rows keyed by index (e.g. for the ifTable table rows are keyed by ifIndex),
   each row object will contain values keyed by column number, will not be
   provided if an error occurred

If an error occurs with any varbind returned by `subtree()` no table will be
passed to the `callback` function.  The reason for failure, and the related
OID string (as returned from a call to the `snmp.varbindError()` function),
will be passed to the `callback` function in the `error` argument as an
instance of the `RequestFailedError` class.

The following example fetches the ifTable (`1.3.6.1.2.1.2.2`) table:

    var oid = "1.3.6.1.2.1.2.2";
    
    function sortInt (a, b) {
        if (a > b)
            return 1;
        else if (b > a)
            return -1;
        else
            return 0;
    }
    
    function responseCb (error, table) {
        if (error) {
            console.error (error.toString ());
        } else {
            // This code is purely used to print rows out in index order,
            // ifIndex's are integers so we'll sort them numerically using
            // the sortInt() function above
            var indexes = [];
            for (index in table)
                indexes.push (parseInt (index));
            indexes.sort (sortInt);
            
            // Use the sorted indexes we've calculated to walk through each
            // row in order
            for (var i = 0; i < indexes.length; i++) {
                // Like indexes we sort by column, so use the same trick here,
                // some rows may not have the same columns as other rows, so
                // we calculate this per row
                var columns = [];
                for (column in table[indexes[i]])
                    columns.push (parseInt (column));
                columns.sort (sortInt);
                
                // Print index, then each column indented under the index
                console.log ("row for index = " + indexes[i]);
                for (var j = 0; j < columns.length; j++) {
                    console.log ("   column " + columns[j] + " = "
                            + table[indexes[i]][columns[j]]);
                }
            }
        }
    }
    
    var maxRepetitions = 20;
    
    // The maxRepetitions argument is optional, and will be ignored unless using
    // SNMP verison 2c
    session.table (oid, maxRepetitions, responseCb);

## session.tableColumns (oid, columns, [maxRepetitions], callback)

The `tableColumns()` method implements the same interface as the `table()`
method.  However, only the columns specified in the `columns` parameter will
be in the resulting table.

This method should be used when only selected columns are required, and
will be many times faster than the `table()` method since a much smaller
amount of data will be fected.

The following example fetches the ifTable (`1.3.6.1.2.1.2.2`) table, and
specifies that only the ifDescr (`1.3.6.1.2.1.2.2.1.2`) and ifPhysAddress
(`1.3.6.1.2.1.2.2.1.6`) columns should actually be fetched:

    var oid = "1.3.6.1.2.1.2.2";
    var columns = [2, 6];
    
    function sortInt (a, b) {
        if (a > b)
            return 1;
        else if (b > a)
            return -1;
        else
            return 0;
    }
    
    function responseCb (error, table) {
        if (error) {
            console.error (error.toString ());
        } else {
            // This code is purely used to print rows out in index order,
            // ifIndex's are integers so we'll sort them numerically using
            // the sortInt() function above
            var indexes = [];
            for (index in table)
                indexes.push (parseInt (index));
            indexes.sort (sortInt);
            
            // Use the sorted indexes we've calculated to walk through each
            // row in order
            for (var i = 0; i < indexes.length; i++) {
                // Like indexes we sort by column, so use the same trick here,
                // some rows may not have the same columns as other rows, so
                // we calculate this per row
                var columns = [];
                for (column in table[indexes[i]])
                    columns.push (parseInt (column));
                columns.sort (sortInt);
                
                // Print index, then each column indented under the index
                console.log ("row for index = " + indexes[i]);
                for (var j = 0; j < columns.length; j++) {
                    console.log ("   column " + columns[j] + " = "
                            + table[indexes[i]][columns[j]]);
                }
            }
        }
    }
    
    var maxRepetitions = 20;
    
    // The maxRepetitions argument is optional, and will be ignored unless using
    // SNMP verison 2c
    session.tableColumns (oid, columns, maxRepetitions, responseCb);

## session.trap (typeOrOid, [varbinds], [agentAddrOrOptions], callback)

The `trap()` method sends a SNMP trap.

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
be the value returned by the `process.uptime ()` function multiplied by 100
(this can be overridden by providing `upTime` in the optional `options`
parameter, as documented below).

This will be followed by a second varbind for the `snmpTrapOID.0` OID
(`1.3.6.1.6.3.1.1.4.1.0`).  The value for this will depend on the `typeOrOid`
parameter.  If a constant is specified the trap OID for the constant
will be used as supplied for the varbinds value, otherwise the OID string
specified will be used as is for the value of the varbind.

The optional `varbinds` parameter is an array of varbinds to include in the
trap, and defaults to the empty array `[]`.

The optional `agentAddrOrOptions` parameter can be one of two types; one is
the IP address used to populate the agent-addr field for SNMP version 1 type
traps, and defaults to `127.0.0.1`, or an object, and can contain the
following items:

 * `agentAddr` - IP address used to populate the agent-addr field for SNMP
   version 1 type traps, and defaults to `127.0.0.1`
 * `upTime` - Value of the `sysUptime.0` OID (`1.3.6.1.6.3.1.1.4.1.0`) in the
   trap, defaults to the value returned by the `process.uptime ()` function
   multiplied by 100

**NOTE** When using SNMP version 2c the `agentAddr` parameter is ignored if
specified since version 2c trap messages do not have an agent-addr field.

The `callback` function is called once the trap has been sent, or an error
occurred.  The following arguments will be passed to the `callback` function:

 * `error` - Instance of the `Error` class or a sub-class, or `null` if no
   error occurred

The following example sends an enterprise specific trap to a remote host using
a SNMP version 1 trap, and includes the sysName (`1.3.6.1.2.1.1.5.0`) varbind
in the trap.  Before the trap is sent the `agentAddr` field is calculated using
DNS to resolve the hostname of the local host:

    var enterpriseOid = "1.3.6.1.4.1.2000.1"; // made up, but it may be valid
    
    var varbinds = [
        {
            oid: "1.3.6.1.2.1.1.5.0",
            type: snmp.ObjectType.OctetString,
            value: "host1"
        }
    ];
    
    dns.lookup (os.hostname (), function (error, agentAddress) {
        if (error) {
            console.error (error);
        } else {
            // Override sysUpTime, specfiying it as 10 seconds...
            var options = {agentAddr: agentAddress, upTime: 1000};
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
            type: snmp.ObjectType.OctetString,
            value: "Hardware health status changed"
        },
        {
            oid: "1.3.6.1.4.1.2000.3",
            type: snmp.ObjectType.OctetString,
            value: "status-error"
        }
    ];
    
    // version 2c should have been specified when creating the session
    session.trap (trapOid, varbinds, function (error) {
        if (error)
            console.error (error);
    });

## session.walk (oid, [maxRepetitions], feedCallback, doneCallback)

The `walk()` method fetches the value for all OIDs lexicographically following
a specified OID in the MIB tree.

For SNMP version 1 repeated `get()` calls are made until the end of the MIB
tree is reached.  For SNMP version 2c repeated `getBulk()` calls are made
until the end of the MIB tree is reached.

The `oid` parameter is an OID string.  The optional `maxRepetitions` parameter
is passed to `getBulk()` requests when SNMP version 2c is being used.

This method will not call a single callback once all OID values are fetched.
Instead the `feedCallback` function will be called each time a response is
received from the remote host.  The following arguments will be passed to the
`feedCallback` function:

 * `varbinds` - Array of varbinds, and will contain at least one varbind

Each varbind must be checked for an error condition using the
`snmp.isVarbindError()` function when using SNMP version 2c.

Once the end of the MIB tree has been reached, or an error has occurred, the
`doneCallback` function will be called.  The following arguments will be
passed to the `doneCallback` function:

 * `error` - Instance of the `Error` class or a sub-class, or `null` if no
   error occurred

Once the `doneCallback` function has been called the request is complete and
the `feedCallback` function will no longer be called.

If the `feedCallback` function returns a `true` value when called no more
`get()` or `getBulk()` method calls will be made and the `doneCallback` will
be called.

The following example walks to the end of the MIB tree starting from the
ifTable (`1.3.6.1.2.1.2.2`) OID:

    var oid = "1.3.6.1.2.1.2.2";
    
    function doneCb (error) {
        if (error)
            console.error (error.toString ());
    }
    
    function feedCb (varbinds) {
        for (var i = 0; i < varbinds.length; i++) {
            if (snmp.isVarbindError (varbinds[i]))
                console.error (snmp.varbindError (varbinds[i]));
            else
                console.log (varbinds[i].oid + "|" + varbinds[i].value);
        }
    }
    
    var maxRepetitions = 20;
    
    // The maxRepetitions argument is optional, and will be ignored unless using
    // SNMP verison 2c
    session.walk (oid, maxRepetitions, feedCb, doneCb);

# Example Programs

Example programs are included under the modules `example` directory.

# Changes

## Version 1.0.0 - 14/01/2013

 * Initial release including only SNMP version 1 support

## Version 1.1.0 - 20/01/2013

 * Implement SNMP version 2c support

## Version 1.1.1 - 21/01/2013

 * Correct name used in example `require()` call to include this module

## Version 1.1.2 - 22/01/2013

 * Implement `subtree()`, `table()` and `walk()` methods
 * Support IPv6 (added `transport` option to the `createSession()` function)
 * Re-order some methods in README.md

## Version 1.1.3 - 27/01/2013

 * Fix some typos and grammar errors in README.md
 * Example `snmp-table` program had `snmp-subtree` in its usage message
 * Implement example `snmp-tail` program to constantly poll for an OIDs value
 * Add note to README.md about the ability to stop the `walk()` and `subtree()`
   methods by returning `true`

## Version 1.1.4 - 29/01/2013

 * Fix incorrect usage of the term "NPM" in README.md, should be "npm"

## Version 1.1.5 - 05/02/2013

 * The `transport` option to `createSession()` was not used

## Version 1.1.6 - 12/04/2013

 * Implement `tableColumns()` method
 * Added example program `snmp-table-columns.js`
 * Correct name of the `table` parameter to the `table()` callback
 * Slight OID comparison performance enhancement

## Version 1.1.7 - 11/05/2013

 * Use MIT license instead of GPL

## Version 1.1.8 - 22/06/2013

 * Added the example program `cisco-device-inventory.js`
 * Receive `Trap failed: TypeError: value is out of bounds` when sending
   traps using SNMP version 2c

## Version 1.1.9 - 03/11/2013

 * Corrected a few instances of the parameter named `requestCallback` to some
   methods in the README.md file which should have been `feedCallback`
 * Null type is used for varbinds with a 0 value
 * Correct instances of snmp.Type to snmp.ObjectType in the README.md file

## Version 1.1.10 - 01/12/2013

 * Error handler in the `dgram.send()` callback in the `send()` method was
   creating a new instance of the `Error` class from the `error` parameter, but
   it was already an instance of the `Error` class (thanks Ray Solomon)
 * Add stack traces to Error classes exported by this module (thanks Ray
   Solomon)
 * Allow users to specify `0` retries when creating a session (thanks Ray
   Solomon)
 * Update the list of SNMP version 1 related RFCs we adhere to in the
   `Standards Compliance` section of the README.md file

## Version 1.1.11 - 27/12/2013

 * Add `sourceAddress` and `sourcePort` optional options to the
   `Session` classes `createSession()` method, which can be used to control
   from which IP address and port messages should be sent
 * Allow users to specify sysUpTime for SNMP traps and informs

## Version 1.1.12 - 02/04/2014

 * The `agentAddr` attribute is not used when passed in the `options` object
   to the `trap()` method

## Version 1.1.13 - 12/08/2014

 * Not catching error events for the UDP socket returned from the
   `dgram.createSocket()` function
 * Some request methods do not copy arguments which results in sometimes
   unexpected behaviour
 * Use a single UDP socket for all requests in a single SNMP session
 * Use a try/catch block in the timer callback in the `Session.send()` method
 * The `Session` can now emit an `error` event to catch errors in a sessions
   underlying UDP socket
 * The `Session` can now emit a `close` event to catch close events from a
   sessions underlying UDP socket, which results in the cancellation of
   all outstanding requests
 * Added a `close()` method to `Session` to close a sessions underlying UDP
   socket, which results a `close` event
 * Signed integers are treated as unsigned integers when parsing response
   messages

## Version 1.1.14 - 22/09/2015

 * Host repository on GitHub

## Version 1.1.15 - 08/02/2016

 * When parsing an invalid response an exception in message parsing does not
   interupt response processing
 * Incorrectly passing `req` object in call to `req.responseCb` when handling
   errors during response processing

## Version 1.1.16 - 29/02/2016

 * Address a number of issues detected with the Mocha test suite by a user

## Version 1.1.17 - 21/03/2016

 * Correct reference to non-existant `req` variable in the `Session` objects
   constructor (should be `this`)

## Version 1.1.18 - 15/05/2015

 * Correct argument number and names to the `snmp.createSession()` function
 * Add missing braces to an example in the README.md file

## Version 1.1.19 - 26/08/2016

 * Remove 64bit integer check to ensure a maximum of 8 bytes are given in send
   and received messages

## Version 1.2.0 - 22/07/2017

 * Replace asn1 dependancy with asn1-ber

## Version 1.2.1 - 11/02/2018

 * Add support of 16bit ids to help interoperate with older devices (added the
   `idBitsSize` option to the `createSession()` function
 * Add note to README.md that sessions should be closed when done with

## Version 1.2.3 - 06/06/2018

 * Set NoSpaceships Ltd to be the owner and maintainer

## Version 1.2.4 - 07/06/2018

 * Remove redundant sections from README.md

# License

Copyright (c) 2018 NoSpaceships Ltd <hello@nospaceships.com>

Copyright (c) 2013 Stephen Vickers <stephen.vickers.sv@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
