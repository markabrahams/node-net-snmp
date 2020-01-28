# net-snmp

This module implements versions 1, 2c and 3 of the [Simple Network Management
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
        session.close ();
    });

    session.trap (snmp.TrapType.LinkDown, function (error) {
        if (error)
            console.error (error);
    });

[SNMP]: http://en.wikipedia.org/wiki/Simple_Network_Management_Protocol "SNMP"
[npm]: https://npmjs.org/ "npm"

# Applications

RFC 3413 describes five types of SNMP applications:

 1. Command Generator Applications &mdash; which initiate read or write requests
 2. Command Responder Applications &mdash; which respond to received read or write requests
 3. Notification Originator Applications &mdash; which generate notifications (traps or informs)
 4. Notification Receiver Applications &mdash; which receive notifications (traps or informs)
 5. Proxy Forwarder Applications &mdash; which forward SNMP messages

This library provides support for all of the above applications, with the documentation
for each shown in this table:

| Application | Common Use | Documentation |
| ----------- | ---------- | ------------- |
| Command Generator | NMS / SNMP tools | [Using This Module: Command & Notification Generator](#using-this-module-command--notification-generator) |
| Command Responder | SNMP agents | [Using This Module: SNMP Agent](#using-this-module-snmp-agent) |
| Notification Originator | SNMP agents / NMS-to-NMS notifications | [Using This Module: Command & Notification Generator](#using-this-module-command--notification-generator) |
| Notification Receiver | NMS | [Using This Module: Notification Receiver](#using-this-module-notification-receiver) |
| Proxy Forwarder | SNMP agents | [Forwarder Module](#forwarder-module) |

# Features

 * Support for all SNMP versions: SNMPv1, SNMPv2c and SNMPv3
 * SNMPv3 message authentication using MD5 or SHA, and privacy using DES or AES encryption
 * Community-based and user-based authorization
 * SNMP initiator for all relevant protocol operations: Get, GetNext, GetBulk, Set, Trap, Inform
 * Convenience methods for MIB "walking", subtree collection, table and table column collection
 * SNMPv3 context support
 * Notification receiver for traps and informs
 * MIB parsing and MIB module store
 * SNMP agent with MIB management for both scalar and tabular data
 * Agent table index support for non-integer keys, foreign keys, composite keys and table augmentation
 * SNMP proxy forwarder for agent
 * IPv4 and IPv6

Not implemented, but on the roadmap:
 * AgentX ([RFC 2741][AgentX])

[AgentX]: https://tools.ietf.org/html/rfc2741 "AgentX"

# Standards Compliance

This module aims to be fully compliant with the following RFCs:

 * [1155][1155] - Structure and Identification of Management Information
 * [1098][1098] - A Simple Network Management Protocol (version 1)
 * [2578][2578] - Structure of Management Information Version 2 (SMIv2)
 * [3413][3413] - Simple Network Management Protocol (SNMP) Applications
 * [3414][3414] - User-based Security Model (USM) for version 3 of the
 Simple Network Management Protocol (SNMPv3)
 * [3416][3416] - Version 2 of the Protocol Operations for the Simple
Network Management Protocol (SNMP)
 * [3417][3417] - Transport Mappings for the Simple Network Management
Protocol (SNMP)
 * [3826][3826] - The Advanced Encryption Standard (AES) Cipher Algorithm
in the SNMP User-based Security Model

[1155]: https://tools.ietf.org/rfc/rfc1155.txt "RFC 1155"
[1098]: https://tools.ietf.org/rfc/rfc1098.txt "RFC 1098"
[2578]: https://tools.ietf.org/rfc/rfc2578.txt "RFC 2578"
[3413]: https://tools.ietf.org/rfc/rfc3413.txt "RFC 3413"
[3414]: https://tools.ietf.org/rfc/rfc3414.txt "RFC 3414"
[3416]: https://tools.ietf.org/rfc/rfc3416.txt "RFC 3416"
[3417]: https://tools.ietf.org/rfc/rfc3417.txt "RFC 3417"
[3826]: https://tools.ietf.org/rfc/rfc3826.txt "RFC 3826"

# Constants

The following sections describe constants exported and used by this module.

## snmp.Version1, snmp.Version2c, snmp.Version3

These constants are used to specify which of version supported by this module
should be used.

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

## snmp.PduType

This object contains constants used to identify the SNMP PDU types specified
in RFC 3416.  The values, along with their numeric codes, are:

 * `160 - GetRequest`
 * `161 - GetNextRequest`
 * `162 - GetResponse`
 * `163 - SetRequest`
 * `164 - Trap`
 * `165 - GetBulkRequest`
 * `166 - InformRequest`
 * `167 - TrapV2`
 * `168 - Report`


## snmp.SecurityLevel

This object contains constants to specify the security of an SNMPv3 message as per
RFC 3414:
 * `noAuthNoPriv` - for no message authentication or encryption
 * `authNoPriv` - for message authentication and no encryption
 * `authPriv` - for message authentication and encryption

## snmp.AuthProtocols

This object contains constants to select a supported digest algorithm for SNMPv3
messages that require authentication:
 * `md5` - for MD5 message authentication (HMAC-MD5-96)
 * `sha` - for SHA message authentication (HMAC-SHA-96)

These are the two hash algorithms specified in RFC 3414.  Other digest algorithms
are not supported.

## snmp.PrivProtocols

This object contains constants to select a supported encryption algorithm for
SNMPv3 messages that require privacy:
 * `des` - for DES encryption (CBC-DES)
 * `aes` - for AES encryption (CFB-AES-128)

DES is the sole encryption algorithm specified in the original SNMPv3 User-Based
Security Model RFC (RFC 3414); AES for SNMPv3 was added later in RFC 3826.  Other
encryption algorithms are not supported.

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
1 and subsequent versions 2c and 3.  In SNMP version 1 if an error occurs when
calculating the value for one OID the request as a whole will fail, i.e. no
OIDs will have a value.

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

In SNMP versions 2c and 3, instead of using the error-status and error-index
fields of the response to signal an error, the value for the varbind placed in the
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

# Using This Module: Command & Notification Generator

This library provides a `Session` class to provide support for building
"Command Generator" and "Notification Originator" SNMP applications.

All SNMP requests are made using an instance of the `Session` class.  This
module exports two functions that are used to create instances of the
`Session` class:

 * `createSession()` - for v1 and v2c sessions
 * `createV3Session()` - for v3 sessions

## snmp.createSession ([target], [community], [options])

The `createSession()` function instantiates and returns an instance of the
`Session` class for SNMPv1 or SNMPv2c:

    // Default options
    var options = {
        port: 161,
        retries: 1,
        timeout: 5000,
        transport: "udp4",
        trapPort: 162,
        version: snmp.Version1,
        idBitsSize: 32
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

## snmp.createV3Session (target, user, [options])

The `createV3Session()` function instantiates and returns an instance of the
same `Session` class as `createSession()`, only instead initialized for SNMPv3:
    
    // Default options for v3
    var options = {
        port: 161,
        retries: 1,
        timeout: 5000,
        transport: "udp4",
        trapPort: 162,
        version: snmp.Version3,
        idBitsSize: 32,
        context: ""
    };

    // Example user
    var user = {
        name: "blinkybill",
        level: snmp.SecurityLevel.authPriv,
        authProtocol: snmp.AuthProtocols.sha,
        authKey: "madeahash",
        privProtocol: snmp.PrivProtocols.des,
        privKey: "privycouncil"
    };
    
    var session = snmp.createV3Session ("127.0.0.1", user, options);

The `target` and `user` parameters are mandatory.  The optional `options` parameter
has the same meaning as for the `createSession()` call.  The one additional field
in the options parameter is the `context` field, which adds an SNMPv3 context to
the session.

The `user` object must contain a `name` and `level` field.  The `level` field can
take these values from the `snmp.SecurityLevel` object:
 * `snmp.SecurityLevel.noAuthNoPriv` - for no message authentication or encryption
 * `snmp.SecurityLevel.authNoPriv` - for message authentication and no encryption
 * `snmp.SecurityLevel.authPriv` - for message authentication and encryption

The meaning of these are as per RFC3414.  If the `level` supplied is `authNoPriv` or
`authPriv`, then the `authProtocol` and `authKey` fields must also be present.  The
`authProtocol` field can take values from the `snmp.AuthProtocols` object:
 * `snmp.AuthProtocols.md5` - for MD5 message authentication
 * `snmp.AuthProtocols.sha` - for SHA message authentication

If the `level` supplied is `authPriv`, then the `privProtocol` and `privKey` fields
must also be present.  The `privProtocol` field can take values from the
`snmp.PrivProtocols` object:
 * `snmp.PrivProtocols.des` - for DES encryption
 * `snmp.PrivProtocols.aes` - for AES encryption

Once a v3 session is created, the same set of `session` methods are available as
for v1 and v2c.

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
their base.  For example, the OIDs sysName (`1.3.6.1.2.1.1.5.0`) and
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
their base, much like the `subtree()` method.

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

# Using This Module: Notification Receiver

RFC 3413 classifies a "Notification Receiver" SNMP application that receives
"Notification-Class" PDUs. Notifications include both SNMP traps and informs.
This library is able to receive all types of notification PDU:

 * `Trap-PDU` (original v1 trap PDUs, which are now considered obselete)
 * `Trapv2-PDU` (unacknowledged notifications)
 * `InformRequest-PDU` (same format as `Trapv2-PDU` but with message acknowledgement)

The library provides a `Receiver` class for receiving SNMP notifications. This
module exports the `createReceiver()` function, which creates a new `Receiver`
instance.

The receiver creates an `Authorizer` instance to control incoming access.  More
detail on this is found below in the [Authorizer Module](#authorizer-module) section
below.

## snmp.createReceiver (options, callback)

The `createReceiver()` function instantiates and returns an instance of the `Receiver`
class:

    // Default options
    var options = {
        port: 162,
        disableAuthorization: false,
        engineID: "8000B98380XXXXXXXXXXXX", // where the X's are random hex digits
        transport: "udp4"
    };

    var callback = function (error, notification) {
        if ( error ) {
            console.error (error);
        } else {
            console.log (JSON.stringify(notification, null, 2));
        }
    };

    receiver = snmp.createReceiver (options, callback);

Note that binding to the default port (162) on some systems requires the receiver process
to be run with administrative privilege.  If this is not possible

The `options` and `callback` parameters are mandatory.  The `options` parameter is
an object, possibly empty, and can contain the following fields:

 * `port` - the port to listen for notifications on - defaults to 162.  Note that binding to
 port 162 on some systems requires the receiver process to be run with administrative
 privilege.  If this is not possible then choose a port greater than 1024.
 * `disableAuthorization` - disables local authorization for all community-based
 notifications received and for those user-based notifications received with no
 message authentication or privacy (noAuthNoPriv) - defaults to false
 * `engineID` - the engineID used for SNMPv3 communications, given as a hex string -
 defaults to a system-generated engineID containing elements of random
 * `transport` - the transport family to use - defaults to `udp4`

The `callback` parameter is a callback function of the form
`function (error, notification)`.  On an error condition, the `notification`
parameter is set to `null`.  On successful reception of a notification, the error
parameter is set to `null`, and the `notification` parameter is set as an object
with the notification PDU details in the `pdu` field and the sender socket details
in the `rinfo` field.  For example:

    {
        "pdu": {
            "type": 166,
            "id": 45385686,
            "varbinds": [
                {
                    "oid": "1.3.6.1.2.1.1.3.0",
                    "type": 67,
                    "value": 5
                },
                {
                    "oid": "1.3.6.1.6.3.1.1.4.1.0",
                    "type": 6,
                    "value": "1.3.6.1.6.3.1.1.5.2"
                }
            ],
            "scoped": false
        },
        "rinfo": {
            "address": "127.0.0.1",
            "family": "IPv4",
            "port": 43162,
            "size": 72
        }
    }

## receiver.getAuthorizer ()

Returns the receiver's `Authorizer` instance, used to control access
to the receiver.  See the `Authorizer` section for further details.

## receiver.close ()

Closes the receiver's listening socket, ending the operation of the receiver.

# Using This Module: SNMP Agent

The SNMP agent responds to all four "request class" PDUs relevant to a Command Responder
application:

 * **GetRequest** - request exactly matched OID instances
 * **GetNextRequest** - request lexicographically "next" OID instances in the MIB tree
 * **GetBulkRequest** - request a series of "next" OID instances in the MIB tree
 * **SetRequest** - set values for specified OIDs

The agent sends a **GetResponse** PDU to all four request PDU types, in conformance to RFC 3416.

The agent - like the notification receiver - maintains an `Authorizer` instance
to control access to the agent, details of which are in the [Authorizer Module](#authorizer-module)
section below.

The central data structure that the agent maintains is a `Mib` instance, the API of which is
detailed in the [Mib Module](#mib-module) section below.  The agent allows the MIB to be queried
and manipulated through the API, as well as queried and manipulated through the SNMP interface with
the above four request-class PDUs.

The agent also supports SNMP proxy forwarder applications with its singleton `Forwarder` instance,
which is documented in the [Forwarder Module](#forwarder-module) section below.

## snmp.createAgent (options, callback)

The `createAgent()` function instantiates and returns an instance of the `Agent`
class:

    // Default options
    var options = {
        port: 161,
        disableAuthorization: false,
        engineID: "8000B98380XXXXXXXXXXXX", // where the X's are random hex digits
        transport: "udp4"
    };

    var callback = function (error, data) {
        if ( error ) {
            console.error (error);
        } else {
            console.log (JSON.stringify(data, null, 2));
        }
    };

    agent = snmp.createAgent (options, callback);

The `options` and `callback` parameters are mandatory.  The `options` parameter is
an object, possibly empty, and can contain the following fields:

 * `port` - the port for the agent to listen on - defaults to 161.  Note that
 binding to port 161 on some systems requires the receiver processto be run with
 administrative privilege.  If this is not possible, then choose a port greater
 than 1024.
 * `disableAuthorization` - disables local authorization for all community-based
 notifications received and for those user-based notifications received with no
 message authentication or privacy (noAuthNoPriv) - defaults to false
 * `engineID` - the engineID used for SNMPv3 communications, given as a hex string -
 defaults to a system-generated engineID containing elements of random
 * `transport` - the transport family to use - defaults to `udp4`

## agent.getAuthorizer ()

Returns the agent's singleton `Authorizer` instance, used to control access
to the agent.  See the `Authorizer` section for further details.

## agent.getMib ()

Returns the agent's singleton `Mib` instance, which holds all of the management data
for the agent.

## agent.getForwarder ()

Returns the agent's singleton `Forwarder` instance, which holds a list of registered
proxies that specify context-based forwarding to remote hosts.

## agent.close ()

Closes the receiver's listening socket, ending the operation of the receiver.

# Authorizer Module

Both the receiver and agent maintain an singleton `Authorizer` instance, which is
responsible for maintaining an authorization list of SNMP communities (for v1 and
v2c notifications) and also an authorization list of SNMP users (for v3 notifications).
These lists are used to authorize notification access to the receiver, and to store
security protocol and key settings.  RFC 3414 terms the user list as the the
"usmUserTable" stored in the receiver's "Local Configuration Database".

If a v1 or v2c notification is received with a community that is not in the
receiver's community authorization list, the receiver will not accept the notification,
instead returning a error of class `RequestFailedError` to the supplied callback
function.  Similarly, if a v3 notification is received with a user whose name is
not in the receiver's user authorization list, the receiver will return a
`RequestFailedError`.  If the `disableAuthorization` option is supplied for the
receiver on start-up, then these local authorization list checks are disabled for
community notifications and noAuthNoPriv user notifications.  Note that even with
this setting, the user list is *still checked* for authNoPriv and authPriv notifications,
as the library still requires access to the correct keys for the message authentication
and encryption operations, and these keys are stored against a user in the user
authorization list.

The API allows the receiver's community authorization and user authorization lists
to be managed with adds, queries and deletes.

The authorizer instance can be obtained by using the `getAuthorizer()`
call, for both the receiver and the agent.  For example:

    receiver.getAuthorizer() .getCommunities();

## authorizer.addCommunity (community)

Adds a community string to the receiver's community authorization list.  Does
nothing if the community is already in the list, ensuring there is only one
occurence of any given community string in the list.

## authorizer.getCommunity (community)

Returns a community string if it is stored in the receiver's community authorization
list, otherwise returns `null`.

## authorizer.getCommunities ()

Returns the receiver's community authorization list.

## authorizer.deleteCommunity (community)

Deletes a community string from the receiver's community authorization list.  Does
nothing if the community is not in the list.

## authorizer.addUser (user)

Adds a user to the receiver's user authorization list.  If a user of the same name
is in the list, this call deletes the existing user, and replaces it with the supplied
user, ensuring that only one user with a given name will exist in the list.  The user
object is in the same format as that used for the `session.createV3Session()` call.

    var user = {
        name: "elsa"
        level: snmp.SecurityLevel.authPriv,
        authProtocol: snmp.AuthProtocols.sha,
        authKey: "imlettingitgo",
        privProtocol: snmp.PrivProtocols.des,
        privKey: "intotheunknown"
    };

    receiver.getAuthorizer ().addUser (elsa);

## authorizer.getUser (userName)

Returns a user object if a user with the supplied name is stored in the receiver's
user authorization list, otherwise returns `null`.

## authorizer.getUsers ()

Returns the receiver's user authorization list.

## authorizer.deleteUser (userName)

Deletes a user from the receiver's user authorization list.  Does nothing if the user
with the supplied name is not in the list.

# Mib Module

An `Agent` instance, when created, in turn creates an instance of the `Mib` class.  There
is no direct API call to create a `Mib` instance; this creation is the responsibility of
the agent.  An agent always has one and only one `Mib` instance.  The agent's `Mib`
instance is accessed through the `agent.getMib ()` call.

The MIB is a tree structure that holds management information.  Information is "addressed"
in the tree by a series of integers, which form an Object ID (OID) from the root of the
tree down.

There are only two kinds of data structures that hold data in a MIB:

 * **scalar** data - the scalar variable is stored at a node in the MIB tree, and
 the value of the variable is a single child node of the scalar variable node, always with
 address "0".  For example, the sysDescr scalar variable is located at "1.3.6.1.2.1.1.1".
 The value of the sysDescr variable is stored at "1.3.6.1.2.1.1.1.0"

    ```
    1.3.6.1.2.1.1.1   <= sysDescr (scalar variable)
    1.3.6.1.2.1.1.1.0 = OctetString: MyAwesomeHost  <= sysDescr.0 (scalar variable value)
    ```

 * **table** data - the SNMP table stores data in columns and rows.  Typically, if a table
 is stored at a node in the MIB, it has an "entry" object addressed as "1" directly
 below the table OID.  Directly below the "entry" is a list of columns, which are typically
 numbered from "1" upwards.  Directly below each column are a series of rows.  In the simplest
 case a row is "indexed" by a single column in the table, but a row index can be a series of
 columns, or columns that give multiple integers (e.g. an IPv4 address has four integers to
 its index), or both.  Here is an example of the hierarchy of an SNMP table for part of the
 ifTable:

    ```
    1.3.6.1.2.1.2.2   <= ifTable (table)
    1.3.6.1.2.1.2.2.1   <= ifEntry (table entry)
    1.3.6.1.2.1.2.2.1.1   <= ifIndex (column 1)
    1.3.6.1.2.1.2.2.1.1.1 = Integer: 1   <= ifIndex row 1 value = 1
    1.3.6.1.2.1.2.2.1.1.2 = Integer: 2   <= ifIndex row 2 value = 2
    ```

On creation, an `Agent` instance creates a singleton instance of the `Mib` module.  You can
then register a "provider" to the agent's `Mib` instance that gives an interface to either a scalar
data instance, or a table.

    var myScalarProvider = {
        name: "sysDescr",
        type: snmp.MibProviderType.Scalar,
        oid: "1.3.6.1.2.1.1.1",
        scalarType: snmp.ObjectType.OctetString,
        handler: function (mibRequest) {
           // e.g. can update the MIB data before responding to the request here
           mibRequest.done ();
        }
    };
    var mib = agent.getMib ();
    mib.registerProvider (myScalarProvider);
    mib.setScalarValue ("sysDescr", "MyAwesomeHost");

This code first gives the definition of a scalar "provider".  A further explanation of
these fields is given in the `mib.registerProvider()` section.  Importantly, the `name`
field is the unique identifier of the provider, and is used to select the specific
provider in subsequent API calls.

The `registerProvider()` call adds the provider to the list of providers that the MIB holds.
Note that this call does not add the "oid" node to the MIB tree.  The first call of
`setScalarValue()` will add the instance OID "1.3.6.1.2.1.1.1.0" to the MIB tree,
along with its value.

At this point, the agent will serve up the value of this MIB node when the instance OID
"1.3.6.1.2.1.1.1.0" is queried via SNMP.

A table provider has a similar definition:

    var myTableProvider = {
        name: "smallIfTable",
        type: snmp.MibProviderType.Table,
        oid: "1.3.6.1.2.1.2.2.1",
        tableColumns: [
            {
                number: 1,
                name: "ifIndex",
                type: snmp.ObjectType.Integer
            },
            {
                number: 2,
                name: "ifDescr",
                type: snmp.ObjectType.OctetString
            },
            {
                number: 3,
                name: "ifType",
                type: snmp.ObjectType.Integer
            }
        ],
        tableIndex: [
            {
                columnName: "ifIndex"
            }
        ]
    };
    var mib = agent.getMib ();
    mib.registerProvider (myTableProvider);
    mib.addTableRow ("smallIfTable", [1, "eth0", 6]);

Here, the provider definition takes two additions fields: `tableColumns` for the column defintions,
and `tableIndex` for the columns used for row indexes.  In the example the `tableIndex` is the
`ifIndex` column.  The `mib.registerProvider()` section has further details on the fields that
make up the provider definition.

The `oid` must be that of the "table entry" node, not its parent "table" node e.g. for
`ifTable`, the `oid` in the provider is "1.3.6.1.2.1.2.2.1" (the OID for `ifEntry`).

Note that there is no `handler` callback function in this particular example, so any interaction
is directly between SNMP requests and MIB values with no other intervention.


## mib.registerProvider (definition)

Registers a provider definition with the MIB.  Doesn't add anything to the MIB tree.

A provider definition has these fields:

 * `name`  *(mandatory)* - the name of the provider, which serves as a unique key to reference the
 provider for getting and setting values
 * `type`  *(mandatory)* - must be either `snmp.MibProviderType.Scalar` or `snmp.MibProviderType.Table`
 (mandatory)
 * `oid`  *(mandatory)* - the OID where the provider is registered in the MIB tree.  Note that this
 is **not** the "instance node" (the ".0" node), but the one above it.  In this case, the
 provider registers at "1.3.6.1.2.1.1.1", to provide the value at "1.3.6.1.2.1.1.1.0".
 * `scalarType`  *(mandatory for scalar types)* - only relevant to scalar provider type, this
  give the type of the variable, selected from `snmp.ObjectType`
 * `tableColumns` *(mandatory for table types)* - gives any array of column definition objects for the
 table.  Each column object must have a unique `number`, a `name` and a `type` from `snmp.ObjectType`.
 * `tableIndex` *(optional for table types)* - gives an array of index entry objects used for row indexes.
 Use a single-element array for a single-column index, and multiple values for a composite index.
 An index entry object has a `columnName` field, and if the entry is in another provider's table, then
 include a `foreign` field with the name of the foreign table's provider.
 If the `tableAugments` field is absent, `tableIndex` is mandatory.
 * `tableAugments` *(optional for table types)* - gives the name of another registered provider that
 this table "augments".  This means that the index information is taken from the given provider's
 table, and doesn't exist in the local table's column definitions.  If the `tableIndex` field is
 absent, `tableAugments` is mandatory i.e. one of `tableIndex` and `tableAugments` needs to be
 present to define the table index.
 * `handler` *(optional)* - an optional callback function, which is called before the request to the
 MIB is made.  This could update the MIB value(s) handled by this provider.  If not given,
 the values are simply returned from (or set in) the MIB without any other processing.
 The callback function takes a `MibRequest` instance, which has a `done()` function.  This
 must be called when finished processing the request.  The `MibRequest` also has an `oid` field
 with the instance OID being operated on, and an `operation` field with the request type from
 `snmp.PduType`.

After registering the provider with the MIB, the provider is referenced by its `name` in other API calls.

While this call registers the provider to the MIB, it does not alter the MIB tree.

## mib.registerProviders ( [definitions] )

Convenience method to register an array of providers in one call.  Simply calls `registerProvider()`
for each provider definition in the array.

## mib.unregisterProvider (name)

Unregisters a provider from the MIB.  This also deletes all MIB nodes from the provider's `oid` down
the tree.  It will also do upstream MIB tree pruning of any interior MIB nodes that only existed for
the MIB tree to reach the provider `oid` node.

## mib.getProviders ()

Returns an object of provider definitions registered with the MIB, indexed by provider name.

## mib.getProvider (name)

Returns a single registered provider object for the given name.

## mib.getScalarValue (scalarProviderName)

Retrieves the value from a scalar provider.

## mib.setScalarValue (scalarProviderName, value)

Sets the value for a scalar provider.  If this is the first time the scalar is set
since the provider has registered with the MIB, it will also add the instance (".0")
node and all requires ancestors to the MIB tree.

## mib.addTableRow (tableProviderName, row)

Adds a table row - in the form of an array of values - to a table provider.  If
the table is empty, this instantiates the provider's `oid` node and ancestors,
its columns, before adding the row of values.  Note that the row is an array of
elements in the order of the table columns.  If the table has any foreign index
columns (i.e. those not belonging to this table), then values for these must be
included the at the start of the row array, in the order they appear in the
MIB INDEX clause.

## mib.getTableColumnDefinitions (tableProviderName)

Returns a list of column definition objects for the provider.

## mib.getTableCells (tableProviderName, byRow, includeInstances)

Returns a two-dimensional array of the table data.  If `byRow` is false (the default),
then the table data is given in a list of column arrays i.e. by column.  If `byRow`
is `true`, then the data is instead a list of row arrays.  If `includeInstances` is
`true`, then, for the column view there will be an extra first column with instance
index information.  If `includeInstances` is `true` for the row view, then there is
an addition element at the start of each row with index information.

## mib.getTableColumnCells (tableProviderName, columnNumber, includeInstances)

Returns a single column of table data for the given column number.  If `includeInstances`
is `true`, then two arrays are returned: the first with instance index information,
and the second with the column data.

## mib.getTableRowCells (tableProviderName, rowIndex)

Returns a single row of table data for the given row index.  The row index is an array
of integers built from the node immediately under the column down to the node at the end
of the row instance, which will be a leaf node in the MIB tree.

## mib.getTableSingleCell (tableProviderName, columnIndex, rowIndex)

Returns a single cell value from the column and row specified.  The row index array is specified
in the same way as for the `getTableRowCells()` call.

## mib.setTableSingleCell (tableProviderName, columnIndex, rowIndex, value)

Sets a single cell value at the column and row specified.  The row index array is specified
in the same way as for the `getTableRowCells()` call.

## mib.deleteTableRow (tableProviderName, rowIndex)

Deletes a table row at the row index specified.  The row index array is specified
in the same way as for the `getTableRowCells()` call.  If this was the last row in the table,
the table is pruned from the MIB, although the provider still remains registered with the MIB.
Meaning that on the addition of another row, the table will be instantiated again.

## mib.dump (options)

Dumps the MIB in text format.  The `options` object controls the display of the dump with these
options fields (all are booleans that default to `true`):

 * `leavesOnly` - don't show interior nodes separately - only as prefix parts of leaf nodes
 (instance nodes)
 * `showProviders` - show nodes where providers are attached to the MIB
 * `showTypes` - show instance value types
 * `showValues` - show instance values

For example:

    mib.dump ();

produces this sort of output:

```
1.3.6.1.2.1.1.1 [Scalar: sysDescr]
1.3.6.1.2.1.1.1.0 = OctetString: Rage inside the machine!
1.3.6.1.2.1.2.2.1 [Table: ifTable]
1.3.6.1.2.1.2.2.1.1.1 = Integer: 1
1.3.6.1.2.1.2.2.1.1.2 = Integer: 2
1.3.6.1.2.1.2.2.1.2.1 = OctetString: lo
1.3.6.1.2.1.2.2.1.2.2 = OctetString: eth0
1.3.6.1.2.1.2.2.1.3.1 = Integer: 24
1.3.6.1.2.1.2.2.1.3.2 = Integer: 6
```

# Using This Module: Module Store

The library supports MIB parsing by providing an interface to a `ModuleStore` instance into which
you can load MIB modules from files, and fetch the resulting JSON MIB module representations.

Additionally, once a MIB is loaded into the module store, you can produce a list of MIB "provider"
definitions that an `Agent` can register (see the `Agent` documentation for more details), so
that you can start manipulating all the values defined in your MIB file right away.

    // Create a module store, load a MIB module, and fetch its JSON representation
    var store = snmp.createModuleStore ();
    store.loadFromFile ("/path/to/your/mibs/SNMPv2-MIB.mib");
    var jsonModule = store.getModule ("SNMPv2-MIB");

    // Fetch MIB providers, create an agent, and register the providers with your agent
    var providers = store.getProvidersForModule ("SNMPv2-MIB");
    // Not recommended - but authorization and callback turned of for example brevity
    var agent = snmp.createAgent ({disableAuthorization: true}, function (error, data) {});
    var mib = agent.getMib ();
    mib.registerProviders (providers);

    // Start manipulating the MIB through the registered providers using the `Mib` API calls
    mib.setScalarValue ("sysDescr", "The most powerful system you can think of");
    mib.setScalarValue ("sysName", "multiplied-by-six");
    mib.addTableRow ("sysOREntry", [1, "1.3.6.1.4.1.47491.42.43.44.45", "I've dreamed up this MIB", 20]);

    // Then hit those bad boys with your favourite SNMP tools (or library ;-), e.g.
    snmpwalk -v 2c -c public localhost 1.3.6.1

Meaning you can get right to the implementation of your MIB functionality with a minimum of
boilerplate code.

## snmp.createModuleStore ()

Creates a new `ModuleStore` instance, which comes pre-loaded with some "base" MIB modules that
that provide MIB definitions that other MIB modules commonly refer to ("import").  The list of
pre-loaded "base" modules is:

 * RFC1155-SMI
 * RFC1158-MIB
 * RFC-1212
 * RFC1213-MIB
 * SNMPv2-SMI
 * SNMPv2-CONF
 * SNMPv2-TC
 * SNMPv2-MIB

## store.loadFromFile (fileName)

Loads all MIB modules in the given file into the module store.  By convention, there is
typically only a single MIB module per file, but there can be multiple module definitions
stored in a single file.  Loaded MIB modules are then referred to by this API by their
MIB module name, not the source file name.  The MIB module name is the name preceding the 
`DEFINITIONS ::= BEGIN` in the MIB file, and is often the very first thing present in
a MIB file.

Note that if your MIB dependends on ("imports") definitions from other MIB files, these must be
loaded first e.g. the popular **IF-MIB** uses definitions from the **IANAifType-MIB**, which
therefore must be loaded first.  These dependencies are listed in the **IMPORTS** section of
a MIB module, usually near the top of a MIB file.  The pre-loaded "base" MIB modules contain
many of the commonly used imports.

## store.getModule (moduleName)

Retrieves the named MIB module from the store as a JSON object.

## store.getModules (includeBase)

Retrieves all MIB modules from the store.  If the `includeBase` boolean is set to true,
then the base MIB modules are included in the list.  The modules are returned as a single
JSON "object of objects", keyed on the module name, with the values being entire JSON
module represenations.

## store.getModuleNames (includeBase)

Retrieves a list of the names of all MIB modules loaded in the store.  If the `includeBase`
boolean is set to true, then the base MIB modules names are included in the list.

## store.getProvidersForModule (moduleName)

Returns an array of `Mib` "provider" definitions corresponding to all scalar and table instance
objects contained in the named MIB module.  The list of provider definitions are then
ready to be registered to an agent's MIB by using the `agent.getMib().registerProviders()`
call.

# Forwarder Module

An `Agent` instance, when created, in turn creates an instance of the `Forwarder` class.
There is no direct API call to create a `Forwarder` instance; this creation is the
responsibility of the agent.  An agent always has one and only one `Forwarder` instance.
The agent's `Forwarder` instance is accessed through the `agent.getForwarder ()` call.

A `Forwader` is what RFC 3413 terms a "Proxy Forwarder Application".  It maintains a list
of "proxy" entries, each of which configures a named SNMPv3 context name to enable access 
to a given target host with the given user credentials.  The `Forwarder` supports proxying
of SNMPv3 sessions only.

```
var forwarder = agent.getForwarder ();
forwarder.addProxy({
    context: "slatescontext",
    host: "bedrock",
    user: {
        name: "slate",
        level: snmp.SecurityLevel.authNoPriv,
        authProtocol: snmp.AuthProtocols.sha,
        authKey: "quarryandgravel"
    },
});
```

Now requests to the agent with the context "slatescontext" supplied will be forwarded to host "bedrock",
with the supplied credentials for user "slate".

You can query the proxy with a local agent user (added with the agent's `Authorizer` instance).
Assuming your proxy runs on localhost, port 161, you could add local user "fred", and access the proxy
with the new "fred" user.

```
var authorizer = agent.getAuthorizer();
authorizer.addUser ({
    name: "fred",
    level: snmp.SecurityLevel.noAuthNoPriv
});

// Test access using Net-SNMP tools (-n is the context option):

snmpget -v 3 -u fred -l noAuthNoPriv -n slatescontext localhost 1.3.6.1.2.1.1.1.0
```

This proxies requests through to "bedrock" as per the proxy definition.

## forwarder.addProxy (proxy)

Adds a new proxy to the forwarder.  The proxy is an object with these fields.

 * `context` *(mandatory)* - the name of the SNMPv3 context for this proxy entry.  This is the unique key
    for proxy entries i.e. there cannot be two proxies with the same context name.
 * `transport` *(optional)* - specifies the transport to use to reach the remote target.  Can be either
    `udp4` or `udp6`, defaults to `udp4`.
 * `target` *(mandatory)* - the remote host that will receive proxied requests.
 * `port` *(optional)* - the port of the SNMP agent on the remote host.  Defaults to 161.
 * `user` *(mandatory)* - the SNMPv3 user.  The format for the user is described in the `createV3Session()`
    call documentation.

## forwarder.deleteProxy (context)

Delete the proxy for the given context from the forwarder.

## forwarder.getProxy (context)

Returns the forwarder's proxy for the given context.

## forwarder.getProxies ()

Returns an object containing a list of all registered proxies, keyed by context name.

## forwarder.dumpProxies ()

Prints a dump of all proxy definitions to the console.


# Example Programs

Example programs are included under the module's `example` directory.

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

## Version 2.0.0 - 16/01/2020

 * Add SNMPv3 support

## Version 2.1.0 - 16/01/2020

 * Add trap and inform receiver

## Version 2.1.1 - 17/01/2020

 * Add CONTRIBUTING.md guidelines

## Version 2.1.2 - 17/01/2020

 * Add SNMPv3 context to Session class

## Version 2.1.3 - 18/01/2020

 * Add IPv6 option for tests

## Version 2.2.0 - 21/01/2020

 * Add SNMP agent

## Version 2.3.0 - 22/01/2020

 * Add MIB parser and module store

## Version 2.4.0 - 24/01/2020

 * Add proxy forwarder to agent

## Version 2.5.0 - 25/01/2020

 * Add AES-128 encryption

## Version 2.5.1 - 27/01/2020

 * Add non-integer, composite key, foreign key and augmented table index handling

## Version 2.5.2 - 29/01/2020

 * Update CONTRIBUTING.md and parser example

# License

Copyright (c) 2020 Mark Abrahams <mark@abrahams.co.nz>

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
