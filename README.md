# net-snmp

This module implements versions 1, 2c and 3 of the [Simple Network Management
Protocol (SNMP)][SNMP].

*Read this in other languages: [English](README.md), [简体中文](README.cn.md).*

This module is installed using [node package manager (npm)][npm]:

```bash
npm install net-snmp
```

It is loaded using the `require()` function:

```js
var snmp = require ("net-snmp");
```

# Quick Start

Sessions to remote hosts can then be created and used to perform SNMP requests
and send SNMP traps or informs:

```js
var session = snmp.createSession ("127.0.0.1", "public");

var oids = ["1.3.6.1.2.1.1.5.0", "1.3.6.1.2.1.1.6.0"];

session.get (oids, function (error, varbinds) {
    if (error) {
        console.error (error);
    } else {
        for (var i = 0; i < varbinds.length; i++) {
            if (snmp.isVarbindError (varbinds[i])) {
                console.error (snmp.varbindError (varbinds[i]));
            } else {
                console.log (varbinds[i].oid + " = " + varbinds[i].value);
            }
        }
    }
    session.close ();
});

session.trap (snmp.TrapType.LinkDown, function (error) {
    if (error) {
        console.error (error);
    }
});
```

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
| Command Generator | NMS / SNMP tools | [Application: Command & Notification Generator](#application-command--notification-generator) |
| Command Responder | SNMP agents | [Application: SNMP Agent](#application-snmp-agent) |
| Notification Originator | SNMP agents / NMS-to-NMS notifications | [Application: Command & Notification Generator](#application-command--notification-generator) |
| Notification Receiver | NMS | [Application: Notification Receiver](#application-notification-receiver) |
| Proxy Forwarder | SNMP agents | [Agent Forwarder Module](#agent-forwarder-module) |

# Features

 * Support for all SNMP versions: SNMPv1, SNMPv2c and SNMPv3
 * SNMPv3 message authentication using MD5 or SHA, and privacy using DES or AES encryption
 * Community-based and user-based authorization
 * SNMP initiator for all relevant protocol operations: Get, GetNext, GetBulk, Set, Trap, Inform
 * Convenience methods for MIB "walking", subtree collection, table and table column collection
 * SNMPv3 context support
 * Notification receiver for traps and informs
 * MIB parsing and MIB module store
 * Translation between numeric and named OIDs
 * SNMP agent with MIB management for both scalar and tabular data
 * Agent table index support for non-integer keys, foreign keys, composite keys and table augmentation
 * Agent support for "RowStatus" protocol-based creation and deletion of table rows
 * Agent support for these MIB constraints: MAX-ACCESS, integer ranges, string sizes, integer enumerations
 * SNMP proxy forwarder for agent
 * AgentX subagent
 * IPv4 and IPv6

# Standards Compliance

This module aims to be fully compliant with the following RFCs:

 * [1098][1098] - A Simple Network Management Protocol (version 1)
 * [1155][1155] - Structure and Identification of Management Information
 * [2571][2571] - Agent Extensibility (AgentX) Protocol Version 1
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
[2571]: https://tools.ietf.org/rfc/rfc2578.txt "RFC 2571"
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

```js
var varbind = {
    oid: "1.3.6.1.2.1.1.4.0",
    type: snmp.ObjectType.OctetString,
    value: "user.name@domain.name"
};
```

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
 * `md5` - for HMAC-MD5 message authentication
 * `sha` - for HMAC-SHA-1 message authentication
 * `sha224` - for HMAC-SHA-224 message authentication
 * `sha256` - for HMAC-SHA-256 message authentication
 * `sha384` - for HMAC-SHA-384 message authentication
 * `sha512` - for HMAC-SHA-512 message authentication

MD5 and SHA (actually SHA-1) are the hash algorithms specified in the original
SNMPv3 User-Based Security Model RFC (RFC 3414); the other four were added later
in RFC 7860.

## snmp.PrivProtocols

This object contains constants to select a supported encryption algorithm for
SNMPv3 messages that require privacy:
 * `des` - for DES encryption (CBC-DES)
 * `aes` - for 128-bit AES encryption (CFB-AES-128)
 * `aes256b` - for 256-bit AES encryption (CFB-AES-256) with "Blumenthal" key localization
 * `aes256r` - for 256-bit AES encryption (CFB-AES-256) with "Reeder" key localization

DES is the sole encryption algorithm specified in the original SNMPv3 User-Based
Security Model RFC (RFC 3414); 128-bit AES for SNMPv3 was added later in RFC 3826.
256-bit AES has *not* been standardized, and as such comes with two varieties of key
localization.  Cisco and a number of other vendors commonly use the "Reeder" key
localization variant.  Other encryption algorithms are not supported.

### Compatibility note on DES and recent Node.js versions

When using SNMPv3 with DES as the privacy protocol (`snmp.PrivProtocols.des`) on Node.js v17 or later, you may encounter the following error:

```
"error": {
        "library": "digital envelope routines",
        "reason": "unsupported",
        "code": "ERR_OSSL_EVP_UNSUPPORTED",
        "message": "error:0308010C:digital envelope routines::unsupported",
        "stack": ["Error: error:0308010C:digital envelope routines::unsupported",
           "at Cipheriv.createCipherBase (node:internal/crypto/cipher:121:19)",
        ...
}
```

This occurs because newer versions of Node.js have deprecated support for the DES algorithm in OpenSSL for security reasons. 

**Workaround:**
If you need to communicate with legacy devices that only support DES for SNMPv3, you can run Node.js with the `--openssl-legacy-provider` flag:

```bash
node --openssl-legacy-provider your-app.js
```

Whenever possible, it's recommended to use more secure encryption methods like AES (`snmp.PrivProtocols.aes`) instead of DES.


## snmp.AgentXPduType

The Agent Extensibility (AgentX) Protocol specifies these PDUs in RFC 2741:
 * `1 - Open`
 * `2 - Close`
 * `3 - Register`
 * `4 - Unregister`
 * `5 - Get`
 * `6 - GetNext`
 * `7 - GetBulk`
 * `8 - TestSet`
 * `9 - CommitSet`
 * `10 - UndoSet`
 * `11 - CleanupSet`
 * `12 - Notify`
 * `13 - Ping`
 * `14 - IndexAllocate`
 * `15 - IndexDeallocate`
 * `16 - AddAgentCaps`
 * `17 - RemoveAgentCaps`
 * `18 - Response`

## snmp.AccessControlModelType

 * `None` - no access control for defined communities and users
 * `Simple` - simple access control of levels "read-only" or "read-write" for defined communites and users

## snmp.AccessLevel

- `None` - no access granted to the community or user
- `ReadOnly` - read-only access granted to the community or user
- `ReadWrite` - read-write access granted to the community or user

## snmp.MaxAccess
- `0 - not-accessible`
- `1 - accessible-for-notify`
- `2 - read-only`
- `3 - read-write`
- `4 - read-create`

## snmp.RowStatus
Status values
- `1 - active`
- `2 - notInService`
- `3 - notReady`

Actions
- `4 - createAndGo`
- `5 - createAndWait`
- `6 - destroy`

## snmp.ResponseInvalidCode
- `1 -  EIp4AddressSize`
- `2 -  EUnknownObjectType`
- `3 -  EUnknownPduType`
- `4 -  ECouldNotDecrypt`
- `5 -  EAuthFailure`
- `6 -  EReqResOidNoMatch`
- `7 -  (no longer used)
- `8 -  EOutOfOrder`
- `9 -  EVersionNoMatch`
- `10 -  ECommunityNoMatch`
- `11 -  EUnexpectedReport`
- `12 -  EResponseNotHandled`
- `13 -  EUnexpectedResponse`

## snmp.OidFormat
- `oid - oid`
- `path - path`
- `module - module`

# OID Strings & Varbinds

Some parts of this module accept simple OID strings, e.g.:

```js
var oid = "1.3.6.1.2.1.1.5.0";
```

Other parts take an OID string, it's type and value.  This is collectively
referred to as a varbind, and is specified as an object, e.g.:

```js
var varbind = {
    oid: "1.3.6.1.2.1.1.5.0",
    type: snmp.ObjectType.OctetString,
    value: new Buffer ("host1")
};
```

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

```js
function responseCb (error, varbinds) {
    if (error) {
        console.error (error);
    } else {
        // no error, do something with varbinds
    }
}
```

When defined, the `error` parameter is always an instance of the `Error` class,
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

```js
var oids = ["1.3.6.1.2.1.1.5.0", "1.3.6.1.2.1.1.6.0"];

session.get (oids, function (error, varbinds) {
    if (error) {
        console.error (error.toString ());
    } else {
        var sysName = varbinds[0].value; // this WILL have a value
    }
});
```

In SNMP versions 2c and 3, instead of using the error-status and error-index
fields of the response to signal an error, the value for the varbind placed in the
response for an OID will have an object syntax describing an error.  The
error-status and error-index fields of the response will indicate the request
was successul, i.e. `snmp.ErrorStatus.NoError`.

This changes the way in which error checking is performed in the `callback`.
When using SNMP version 2c each varbind must be checked to see if its value
was computed and returned successfully:

```js
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
```

This module exports two functions and promotes a specifc pattern to make error
checking a little simpler.  Firstly, regardless of version in use varbinds can
always be checked.  This results in a generic `callback` that can be used for
both versions.

The `isVarbindError()` function can be used to determine if a varbind has an
error condition.  This function takes a single `varbind` parameter and returns
`true` if the varbind has an error condition, otherwise `false`.  The exported
`varbindError()` function can then be used to obtain the error string
describing the error, which will include the OID for the varbind:

```js
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
```

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

This error indicates a failure to parse a response message. The
exposed `message` attribute will contain a detailed error message, and
as a sub-class of Error, its `toString()` method will yield that
`message` attribute.

An error of this class will always additionally include a `code`
attribute (one of the values in `ResponseInvalidCode`); and in some
cases, also have an `info` attribute which provides `code`-specific
supplemental information. An authentication error, for example -- code
`ResponseInvalidCode.EAuthFailure` -- will contain a map in `info`
with the attempted authentication data which failed to authenticate.

## snmp.ProcessingError

If a receiver or an agent receives a packet it is unable to decode,
then it will produce a `ProcessingError` containing:
* `rinfo` information on the origin of the packet,
* a `buffer` containing the packet contents, and
* an `error` containing the original error encountered during processing.

# Application: Command & Notification Generator

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

```js
// Default options
var options = {
    port: 161,
    retries: 1,
    timeout: 5000,
    backoff: 1.0,
    transport: "udp4",
    trapPort: 162,
    version: snmp.Version1,
    backwardsGetNexts: true,
    reportOidMismatchErrors: false,
    idBitsSize: 32
};

var session = snmp.createSession ("127.0.0.1", "public", options);
```

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
 * `backoff` - The factor by which to increase the `timeout` for every retry, defaults to `1` for
   no increase
 * `transport` - Specify the transport to use, can be either `udp4` or `udp6`,
   defaults to `udp4`
 * `trapPort` - UDP port to send traps and informs too, defaults to `162`
 * `version` - Either `snmp.Version1` or `snmp.Version2c`, defaults to
   `snmp.Version1`
 * `backwardsGetNexts` - boolean to allow GetNext operations to retrieve lexicographically
   preceding OIDs, defaults to `true`
 * `reportOidMismatchErrors` - boolean to allow error reporting of OID mismatches between
   requests and responses, defaults to `false`
 * `idBitsSize` - Either `16` or `32`, defaults to `32`.  Used to reduce the size
    of the generated id for compatibility with some older devices.

When a session has been finished with it should be closed:

```js
session.close ();
```

## snmp.createV3Session (target, user, [options])

The `createV3Session()` function instantiates and returns an instance of the
same `Session` class as `createSession()`, only instead initialized for SNMPv3:

```js
// Default options for v3
var options = {
    port: 161,
    retries: 1,
    timeout: 5000,
    transport: "udp4",
    trapPort: 162,
    version: snmp.Version3,
    engineID: "8000B98380XXXXXXXXXXXXXXXXXXXXXXXX", // where the X's are random hex digits
    backwardsGetNexts: true,
    reportOidMismatchErrors: false,
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
```

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

The `close` event is emitted by the session when the session's underlying UDP
socket is closed.

No arguments are passed to the callback.

Before this event is emitted all outstanding requests are cancelled, resulting
in the failure of each outstanding request.  The error passed back through to
each request will be an instance of the `Error` class with the errors
`message` attribute set to `Socket forcibly closed`.

The following example prints a message to the console when a session's
underlying UDP socket is closed:

```js
session.on ("close", function () {
    console.log ("socket closed");
});
```

## session.on ("error", callback)

The `error` event is emitted by the session when the session's underlying UDP
socket emits an error.

The following arguments will be passed to the `callback` function:

 * `error` - An instance of the `Error` class, the exposed `message` attribute
   will contain a detailed error message.

The following example prints a message to the console when an error occurs
with a session's underlying UDP socket, the session is then closed:

```js
session.on ("error", function (error) {
    console.log (error.toString ());
    session.close ();
});
```

## session.close ()

The `close()` method closes the sessions underlying UDP socket.  This will
result in the `close` event being emitted by the sessions underlying UDP
socket which is passed through to the session, resulting in the session also
emitting a `close` event.

The following example closes a sessions underlying UDP socket:

```js
session.close ();
```

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

```js
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
```

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

```js
var oids = [
    "1.3.6.1.2.1.1.4.0",
    "1.3.6.1.2.1.1.5.0",
    "1.3.6.1.2.1.2.2.1.2",
    "1.3.6.1.2.1.2.2.1.3"
];

var nonRepeaters = 2;

session.getBulk (oids, nonRepeaters, function (error, varbinds) {
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
    }
});
```

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

```js
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
```

## session.inform (typeOrOid, [varbinds], [options], callback)

The `inform()` method sends a SNMP inform.

The `typeOrOid` parameter can be one of two types; one of the constants
defined in the `snmp.TrapType` object (excluding the
`snmp.TrapType.EnterpriseSpecific` constant), or an OID string.

The first varbind to be placed in the request message will be for the
`sysUptime.0` OID (`1.3.6.1.2.1.1.3.0`).  The value for this varbind will
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

 * `upTime` - Value of the `sysUptime.0` OID (`1.3.6.1.2.1.1.3.0`) in the
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

```js
session.inform (snmp.TrapType.ColdStart, function (error) {
    if (error)
        console.error (error);
});
```

The following example sends an enterprise specific inform to a remote host,
and includes two enterprise specific varbinds:

```js
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
```

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

```js
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
```

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

```js
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
```

## session.table (oid, [maxRepetitions], callback)

The `table()` method fetches the value for all OIDs lexicographically
following a specified OID in the MIB tree which have the specified OID as
their base, much like the `subtree()` method.

This method is designed to fetch conceptual tables, for example the ifTable
(`1.3.6.1.2.1.2.2`) table.  The values for returned varbinds will be structured
into objects to represent conceptual rows.  Each row is then placed into an
object with the rows index being the key, e.g.:

```js
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
```

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

```js
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
```

## session.tableColumns (oid, columns, [maxRepetitions], callback)

The `tableColumns()` method implements the same interface as the `table()`
method.  However, only the columns specified in the `columns` parameter will
be in the resulting table.

This method should be used when only selected columns are required, and
will be many times faster than the `table()` method since a much smaller
amount of data will be fetched.

The following example fetches the ifTable (`1.3.6.1.2.1.2.2`) table, and
specifies that only the ifDescr (`1.3.6.1.2.1.2.2.1.2`) and ifPhysAddress
(`1.3.6.1.2.1.2.2.1.6`) columns should actually be fetched:

```js
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
```

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
`sysUptime.0` OID (`1.3.6.1.2.1.1.3.0`).  The value for this varbind will
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
 * `upTime` - Value of the `sysUptime.0` OID (`1.3.6.1.2.1.1.3.0`) in the
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

```js
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
```

The following example sends a generic link-down trap to a remote host using a
SNMP version 1 trap, it does not include any varbinds or specify the
`agentAddr` parameter:

```js
session.trap (snmp.TrapType.LinkDown, function (error) {
    if (error)
        console.error (error);
});
```

The following example sends an enterprise specific trap to a remote host using
a SNMP version 2c trap, and includes two enterprise specific varbinds:

```js
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
```

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

```js
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
```

# Application: Notification Receiver

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

```js
// Default options
var options = {
    port: 162,
    disableAuthorization: false,
    includeAuthentication: false,
    accessControlModelType: snmp.AccessControlModelType.None,
    engineID: "8000B98380XXXXXXXXXXXXXXXXXXXXXXXX", // where the X's are random hex digits
    address: null,
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
```

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
 * `address` - the IP address to bind to - default to `null`, which means bind to all IP
 addresses
 * `includeAuthentication` - adds the community (v1/2c) or user name (v3) information
 to the notification callback - defaults to `false`
 * `sockets` - an array of objects containing triples of `transport`, `address` and `port` that
 can be used to specify multiple socket listeners.  This option overrides any individual
 `transport`, `address` and `port` options.

The `callback` parameter is a callback function of the form
`function (error, notification)`.  On an error condition, the `notification`
parameter is set to `null`.  On successful reception of a notification, the error
parameter is set to `null`, and the `notification` parameter is set as an object
with the notification PDU details in the `pdu` field and the sender socket details
in the `rinfo` field.  For example:

```json
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
```

## receiver.getAuthorizer ()

Returns the receiver's `Authorizer` instance, used to control access
to the receiver.  See the `Authorizer` section for further details.

## receiver.close (callback)

Closes the receiver's listening socket(s), ending the operation of the receiver.  The optionnal
`callback` parameter is a callback function of the form `function (socket)`, which will be
called once for each socket that the receiver is listening on, after the socket is closed.
The `socket` argument will be given as an object triple of `address`, `family` and `port`.

# Application: SNMP Agent

The SNMP agent responds to all four "request class" PDUs relevant to a Command Responder
application:

 * **GetRequest** - request exactly matched OID instances
 * **GetNextRequest** - request lexicographically "next" OID instances in the MIB tree
 * **GetBulkRequest** - request a series of "next" OID instances in the MIB tree
 * **SetRequest** - set values for specified OIDs

The agent sends a **GetResponse** PDU to all four request PDU types, in conformance with RFC 3416.

The agent - like the notification receiver - maintains an `Authorizer` instance
to control access to the agent, details of which are in the [Authorizer Module](#authorizer-module)
section below.

The central data structure that the agent maintains is a `Mib` instance, the API of which is
detailed in the [Mib Module](#mib-module) section below.  The agent allows the MIB to be queried
and manipulated through the API, as well as queried and manipulated through the SNMP interface with
the above four request-class PDUs.

The agent also supports SNMP proxy forwarder applications with its singleton `Forwarder` instance,
which is documented in the [Forwarder Module](#forwarder-module) section below.

## snmp.createAgent (options, callback, mib)

The `createAgent()` function instantiates and returns an instance of the `Agent`
class:

```js
// Default options
var options = {
    port: 161,
    disableAuthorization: false,
    accessControlModelType: snmp.AccessControlModelType.None,
    engineID: "8000B98380XXXXXXXXXXXXXXXXXXXXXXXX", // where the X's are random hex digits
    address: null,
    transport: "udp4",
    mibOptions: {}
};

var callback = function (error, data) {
    if ( error ) {
        console.error (error);
    } else {
        console.log (JSON.stringify(data, null, 2));
    }
};

agent = snmp.createAgent (options, callback);
```

The `options` and `callback` parameters are mandatory.  The `options` parameter is
an object, possibly empty, and can contain the following fields:

 * `port` - the port for the agent to listen on - defaults to 161.  Note that
 binding to port 161 on some systems requires the receiver process to be run with
 administrative privilege.  If this is not possible, then choose a port greater
 than 1024.
 * `disableAuthorization` - disables local authorization for all community-based
 notifications received and for those user-based notifications received with no
 message authentication or privacy (noAuthNoPriv) - defaults to false
 * `accessControlModelType` - specifies which access control model to use.  Defaults
 to `snmp.AccessControlModelType.None`, but can be set to `snmp.AccessControlModelType.Simple`
 for further access control capabilities.  See the `Authorization` class description
 for more information.
 * `engineID` - the engineID used for SNMPv3 communications, given as a hex string -
 defaults to a system-generated engineID containing elements of random
 * `transport` - the transport family to use - defaults to `udp4`
 * `address` - the IP address to bind to - default to `null`, which means bind to all IP
 addresses
 * `sockets` - an array of objects containing triples of `transport`, `address` and `port` that
 can be used to specify multiple socket listeners.  This option overrides any individual
 `transport`, `address` and `port` options.
 * `mibOptions` - a MIB options object that is passed to the `Mib` instance - see the MIB section
 for further details on this - defaults to the empty object.

The `mib` parameter is optional, and sets the agent's singleton `Mib` instance.
If not supplied, the agent creates itself a new empty `Mib` singleton.  If supplied,
the `Mib` instance needs to be created and populated as per the [Mib Module](#mib-module)
section below.

## agent.getAuthorizer ()

Returns the agent's singleton `Authorizer` instance, used to control access
to the agent.  See the `Authorizer` section for further details.

## agent.getMib ()

Returns the agent's singleton `Mib` instance, which holds all of the management data
for the agent.

## agent.setMib (mib)

Sets the agent's singleton `Mib` instance to the supplied one.  The agent discards
its existing `Mib` instance.

## agent.getForwarder ()

Returns the agent's singleton `Forwarder` instance, which holds a list of registered
proxies that specify context-based forwarding to remote hosts.

## agent.close (callback)

Closes the agent's listening socket(s), ending the operation of the agent.  The optionnal
`callback` parameter is a callback function of the form `function (socket)`, which will be
called once for each socket that the agent is listening on, after the socket is closed.
The `socket` argument will be given as an object triple of `address`, `family` and `port`.

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

The API allows the receiver's / agent's community authorization and user authorization lists
to be managed with adds, queries and deletes.

For an agent, there is a further optional access control check, that can limit the
access for a given community or user according to the `AccessControlModelType` supplied
as an option to the agent.  The default model type is `snmp.AccessControlModelType.None`,
which means that - after the authorization list checks described in the preceding paragraphs -
there is no further access control restrictions i.e. all requests are granted access by
the agent.  A second access control model type `snmp.AccessControlModelType.Simple` can
be selected, which creates a `SimpleAccessControlModel` object that can be manipulated
to specify that a community or user has one of three levels of access to agent information:
 * none
 * read-only
 * read-write

More information on how to configure access with the `SimpleAccessControlModel` class is
provided below under the description of that class.

The authorizer instance can be obtained by using the `getAuthorizer()`
call, for both the receiver and the agent.  For example:

```js
receiver.getAuthorizer ().getCommunities ();
```

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

```js
var user = {
    name: "elsa",
    level: snmp.SecurityLevel.authPriv,
    authProtocol: snmp.AuthProtocols.sha,
    authKey: "imlettingitgo",
    privProtocol: snmp.PrivProtocols.des,
    privKey: "intotheunknown"
};

receiver.getAuthorizer ().addUser (elsa);
```

## authorizer.getUser (userName)

Returns a user object if a user with the supplied name is stored in the receiver's
user authorization list, otherwise returns `null`.

## authorizer.getUsers ()

Returns the receiver's user authorization list.

## authorizer.deleteUser (userName)

Deletes a user from the receiver's user authorization list.  Does nothing if the user
with the supplied name is not in the list.

## authorizer.getAccessControlModelType ()

Returns the `snmp.AccessControlModelType` of this authorizer, which is one of:
- `snmp.AccessControlModelType.None`
- `snmp.AccessControlModelType.Simple`

## authorizer.getAccessControlModel ()

Returns the access control model object:
- for a type of `snmp.AccessControlModelType.None` - returns null (as the access control check returns positive every time)
- for a type of `snmp.AccessControlModelType.Simple` - returns a `SimpleAccessControlModel` object

# Simple Access Control Model

The `SimpleAccessControlModel` class can be optionally selected as the access control model used by an `Agent`.  The
`SimpleAccessControlModel` provides basic three-level access control for a given community or user.
The access levels are specified in the snmp.AccessLevel constant:
 * `snmp.AccessLevel.None` - no access is granted to the community or user
 * `snmp.AccessLevel.ReadOnly` - access is granted for the community or user for Get, GetNext and GetBulk requests but not Set requests
 * `snmp.AccessLevel.ReadWrite` - access is granted for the community or user for Get, GetNext, GetBulk and Set requests

The `SimpleAccessControlModel` is not created via a direct API call, but is created internally by an `Agent`'s `Authorizer` singleton.
So an agent's access control model can be accessed with:

```js
var acm = agent.getAuthorizer ().getAccessControlModel ();
```

Note that any community or user that is used in any of the API calls in this section must first be created in the agent's `Authorizer`,
otherwise the agent will fail the initial community/user list check that the authorizer performs.

When using the Simple Access Control Model, the default access level for a newly created community or user in the
`Authorizer` is read-only.

Example use:

```js
var agent = snmp.createAgent({
    accessControlModelType: snmp.AccessControlModelType.Simple
}, function (error, data) {
    // null callback for example brevity
});
var authorizer = agent.getAuthorizer ();
authorizer.addCommunity ("public");
authorizer.addCommunity ("private");
authorizer.addUser ({
    name: "fred",
    level: snmp.SecurityLevel.noAuthNoPriv
});
var acm = authorizer.getAccessControlModel ();
// Since read-only is the default, explicitly setting read-only access is not required - just shown here as an example
acm.setCommunityAccess ("public", snmp.AccessLevel.ReadOnly);
acm.setCommunityAccess ("private", snmp.AccessLevel.ReadWrite);
acm.setUserAccess ("fred", snmp.AccessLevel.ReadWrite);
```

## simpleAccessControlModel.setCommunityAccess (community, accessLevel)

Grant the given community the given access level.

## simpleAccessControlModel.removeCommunityAccess (community)

Remove all access for the given community.

## simpleAccessControlModel.getCommunityAccessLevel (community)

Return the access level for the given community.

## simpleAccessControlModel.getCommunitiesAccess ()

Return a list of all community access control entries defined by this access control model.

## simpleAccessControlModel.setUserAccess (userName, accessLevel)

Grant the given user the given access level.

## simpleAccessControlModel.removeUserAccess (userName)

Remove all access for the given user.

## simpleAccessControlModel.getUserAccessLevel (userName)

Return the access level for the given user.

## simpleAccessControlModel.getUsersAccess ()

Return a list of all user access control entries defined by this access control model.


# Mib Module

An `Agent` instance, when created, in turn creates an instance of the `Mib` class.
An agent always has one and only one `Mib` instance.  The agent's `Mib` instance is
accessed through the `agent.getMib ()` call.

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

```js
var myScalarProvider = {
    name: "sysDescr",
    type: snmp.MibProviderType.Scalar,
    oid: "1.3.6.1.2.1.1.1",
    scalarType: snmp.ObjectType.OctetString,
    maxAccess: snmp.MaxAccess["read-write"],
    handler: function (mibRequest) {
       // e.g. can update the MIB data before responding to the request here
       mibRequest.done ();
    }
};
var mib = agent.getMib ();
mib.registerProvider (myScalarProvider);
mib.setScalarValue ("sysDescr", "MyAwesomeHost");
```

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

```js
var myTableProvider = {
    name: "smallIfTable",
    type: snmp.MibProviderType.Table,
    oid: "1.3.6.1.2.1.2.2.1",
    maxAccess: snmp.MaxAccess["not-accessible"],
    tableColumns: [
        {
            number: 1,
            name: "ifIndex",
            type: snmp.ObjectType.Integer,
            maxAccess: snmp.MaxAccess["read-only"]
        },
        {
            number: 2,
            name: "ifDescr",
            type: snmp.ObjectType.OctetString,
            maxAccess: snmp.MaxAccess["read-write"],
        },
        {
            number: 3,
            name: "ifType",
            type: snmp.ObjectType.Integer,
            maxAccess: snmp.MaxAccess["read-only"],
            constraints: {
                enumeration: {
                    "1": "goodif",
                    "2": "averageif",
                    "3": "badif"
                }
            }
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
```

Here, the provider definition takes two additions fields: `tableColumns` for the column defintions,
and `tableIndex` for the columns used for row indexes.  In the example the `tableIndex` is the
`ifIndex` column.  The `mib.registerProvider()` section has further details on the fields that
make up the provider definition.

The `oid` must be that of the "table entry" node, not its parent "table" node e.g. for
`ifTable`, the `oid` in the provider is "1.3.6.1.2.1.2.2.1" (the OID for `ifEntry`).

Note that there is no `handler` callback function in this particular example, so any interaction
is directly between SNMP requests and MIB values with no other intervention.

## Constraints
Three types of constraints are supported: enumerations, integer
ranges, and string sizes. These can be specified in a handler's
`constraints` map, with keys `enumeration`, `ranges`, or `sizes`.

Any SetRequest protocol operations are checked against the defined constraints, and are not
actioned if the value in the SetRequest would violate the constraints e.g. the value is not
a member of the defined enumeration.

The MIB parser converts definitions such as this to `enumeration` constraints (see RFC 2578 Section 7.1.1):
```
SYNTAX       INTEGER { cont(0), alt(1) }
```

It converts definitions such as these to `ranges` constraints (see RFC 2578 Appendix A):
```
SYNTAX       Integer32 (172..184)
```

And it converts definitions like these to `sizes` constraints (see RFC 2578 Appendix A):
```
SYNTAX       OCTET STRING (SIZE (0..31))
```

### enumerations
Enumerations identify each of the valid values of an object of type Integer, like this:
```js
constraints: {
    enumeration: {
        "1": "goodif",
        "2": "averageif",
        "3": "badif"
    }
```

### ranges
Ranges are used in Integer types, to limit the object's allowable
values. They are specified using an array of maps. Each map optionally
contains `min` and/or `max` values, specifying a single range.
Mutliple ranges allow the union of values specified by those ranges.
Specifying only `min` in a range allows all values greater than or
equal to the specified one to be valid. Specifying only `max` in a
range allows all values less than or equal to the specified one to be
valid. This example shows that any value between 1 and 3 (inclusive)
or 5 or greater is allowed, i.e., all integers greater than or equal
to 1, except 4:
```js
constraints: {
    ranges: [
        { min: 1, max: 3 },
        { min: 5 }
    ]
},
```

### sizes
Sizes are used to limit the lengths of strings. The syntax is similar
to `ranges`, allowing multiple ranges of sizes each potentially
providing `min` and`max` values. A constraint that allows a string to
be any length 1 or greater, except length 4, would look like this:
```js
constraints: {
    sizes: [
        { min: 1, max: 3 },
        { min: 5 }
    ]
}
```
## snmp.createMib (options)

The `createMib()` function instantiates and returns an instance of the
`Mib` class. The new Mib does not have any nodes (except for a single
root node) and does not have any registered providers.

Note that this is only usable for an agent, not an AgentX subagent.  Since an agent instanciates
a `Mib` instance on creation, this call is not needed in many scenarios.  Two scenarios where it
might be useful are:

 * where you want to pre-populate a `Mib` instance with providers and scalar/tabular data
 before creating the `Agent` instance itself.
 * where you want to swap out an agent's existing `Mib` instance for an entirely new one.

The `options` object is optional.  If supplied, a single key is supported:
 * `addScalarDefaultsOnRegistration` - if `true`, automatically adds to the MIB a scalar with a
 default value (`defVal`) in its provider definition upon registration of the provider.
 The default value is `false`, which means the MIB is unchanged on registration of the provider,
 even if a `defVal` is present in the provider definition.

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
 table.  Each column object must have a unique `number`, a `name`, a `type` from `snmp.ObjectType`, and
 a `maxAccess` value from `snmp.MaxAccess`. A column object with type `ObjectType.Integer` can optionally
 contain a `constraints` object, the format and meaning of which is identical to that defined on a single
 scalar provider (see the "Constraints" section above for further details on this).
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
 * `maxAccess` *(mandatory)* - specifies the maximum allowed access
level provided by this provider. The allowable values are the
numeric values from the MaxAccess export. If a `maxAccess` value is
specified, a `get` request to the agent will return a `noAccess`
error if `maxAccess` is not at least "read-only" (2). `maxAccess`
must be at least "read-write" (3) for a `set` request to succeed.
 * `defVal` *(optional)* - the default value to assign for scalar
objects automatically created, when `maxAccess` is set to
"read-create" (4). Note that table columns can specify such `defVal`
default values in an identical way, to be used when a new row is to be
automatically created, except that these are stored under the column
object definition for each column. See `Automatic creation of
objects`, below, for details.
 * `handler` *(optional)* - an optional callback function, which is called before the request to the
 MIB is made.  This could update the MIB value(s) handled by this provider.  If not given,
 the values are simply returned from (or set in) the MIB without any other processing.
 The callback function takes a `MibRequest` instance, which has a `done()` function.  This
 must be called when finished processing the request.  To signal an error, give a single error object
 in the form of `{errorStatus: <status>}`, where `<status>` is a value from ErrorStatus e.g.
 `{errorStatus: snmp.ErrorStatus.GeneralError}`.  The `MibRequest` also has an `oid` field
 with the instance OID being operated on, and an `operation` field with the request type from
 `snmp.PduType`.  If the `MibRequest` is for a `SetRequest` PDU, then variables `setValue` and
 `setType` contain the value and type received in the `SetRequest` varbind.
 * `constraints` *(optional for scalar types)* - an optional object to specify constraints for
 integer-based enumerated types, integer range restrictions and string size restrictions.  Note that
 table columns can specify such `constraints` in an identical way, except that these are stored under
 the column object definition for each column.  See the "Constraints" section above for further details.

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
node and all required ancestors to the MIB tree.

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
of index values built from the node immediately under the column down to the node at the end
of the row instance, which will be a leaf node in the MIB tree.  Ultimately, non-integer values
need to be converted to a sequence of integers that form the instance part of the OID.  Here
are the details of the conversions from index values to row instance OID sequences:
- **ObjectType.Integer** - single integer
- **ObjectType.OctetString** - a sequence of integer ASCII values
- **ObjectType.OID** - the exact sequence of integers in the OID
- **ObjectType.IpAddress** - a sequence of the four integers in the IP address

## mib.getTableSingleCell (tableProviderName, columnNumber, rowIndex)

Returns a single cell value from the column and row specified.  The row index array is specified
in the same way as for the `getTableRowCells()` call.

## mib.setTableSingleCell (tableProviderName, columnNumber, rowIndex, value)

Sets a single cell value at the column and row specified.  The row index array is specified
in the same way as for the `getTableRowCells()` call.

## mib.deleteTableRow (tableProviderName, rowIndex)

Deletes a table row at the row index specified.  The row index array is specified
in the same way as for the `getTableRowCells()` call.  If this was the last row in the table,
the table is pruned from the MIB, although the provider still remains registered with the MIB.
Meaning that on the addition of another row, the table will be instantiated again.

## mib.setScalarDefaultValue (tableProviderName, defaultValue)

Adds a default value, called `defVal`, to a scalar provider. This
default value will be used for automatic creation of the scalar's
object instance, when its `maxAccess` value is "read-create". This
method is of primary usefulness when providers are automatically
created, e.g., via `store.getProvidersForModule`. See `Automatic
creation of objects` for details.

## mib.setTableRowDefaultValues (tableProviderName, defaultValues)

Add default values, called `defVal`, to each table column in a table
provider. These default values will be used for automatic creation of
a table row. `defaultValues` must be an array of values of length
equal to the length of the tableColumns array in the provider. When a
specific column need not be given a default value, that element of the
array should be set to `undefined`. This method is of primary
usefulness when providers are automatically created, e.g., via
`store.getProvidersForModule`. See `Automatic creation of objects` for
details.

## mib.dump (options)

Dumps the MIB in text format.  The `options` object controls the display of the dump with these
options fields (all are booleans that default to `true`):

 * `leavesOnly` - don't show interior nodes separately - only as prefix parts of leaf nodes
 (instance nodes)
 * `showProviders` - show nodes where providers are attached to the MIB
 * `showTypes` - show instance value types
 * `showValues` - show instance values

For example:

```js
mib.dump ();
```

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

## Automatic creation of objects

### Scalars
When a provider's `maxAccess` is set to "read-create" (4), then an
agent request to access the object's instance will result in the
instance being automatically created, if `defVal` is also defined in
the provider. The new instance's value will be set to the default
value specified in `defVal`. If `defVal` is not specified in the
provider, then the instance will not, by default, be automatically
created.

The default handling of instance creation can be overridden by
providing a handler in a provider, called, `createHandler`. The
handler is passed a `createRequest` object, containing a singe
field `provider` - the provider for the scalar. The
method must return either the value to be assigned to the
newly-created instance; or `undefined` to indicate that the instance
should not be created.

An example handler method, accomplishing the default behavior, looks
like this:

```
function scalarReadCreateHandler (createRequest) {
    let provider = createRequest.provider;
	// If there's a default value specified...
	if ( typeof provider.defVal != "undefined" ) {
		// ... then use it
		return provider.defVal;
	}

	// We don't have enough information to auto-create the scalar
	return undefined;
}
```

Automatic instance creation of table rows can be disabled entirely by
setting `createHandler` to null.

### Table rows

Table rows may be added to a table, or deleted from it, if the table
has a column defined with `rowStatus: true` in the provider.
The semantics of adding and deleting rows is described beginning on
page 5 of RFC 2579, and in
[SNMPv2-TC.mib](https://github.com/markabrahams/node-net-snmp/blob/master/lib/mibs/SNMPv2-TC.mib#L186).
The row status column is typically referred to, simply, as the Status
column.

When a row does not exist and its Status column's value is set to
"createAndGo" (4) or "createAndWait" (5), the specified row will be
created, by default, using the default values specified in each
non-index and non-Status column's `defVal` member. If `defVal` is not
specified in any column other than index or Status columns, the row
will not be automatically created.

The default handling of row creation can be overridden by providing a
handler in a provider, called, `createHandler`. The handler is
passed a `createRequest` object with three fields:

- `provider` - the provider for the table
- `action` - the action invoking the row creation: one of "createAndGo" or "createAndWait"
- `row` - an array of columns forming the table index, where each element of
  the array is an index into the `tableColumns` array of the provider

The handler must return either an array of column values for the new
row, with exactly one value corresponding to each column specified in
`tableColumns`; or `undefined` to indicate that the row should not be
created.

An example handler method, accomplishing the default behavior, looks
like this:

```
function tableRowStatusHandler(createRequest) {
    let provider = createRequest.provider;
    let action = createRequest.action;
    let row = createRequest.row;
	let values = [];
	let missingDefVal = false;
	let rowIndexValues = Array.isArray( row ) ? row.slice(0) : [ row ];
	const tc = provider.tableColumns;

	tc.forEach(
		(columnInfo, index) => {
			let entries;

			// Index columns get successive values from the rowIndexValues array.
			// RowStatus columns get either "active" or "notInService" values.
			// Every other column requires a defVal.
			entries = provider.tableIndex.filter( entry => columnInfo.number === entry.columnNumber );
			if (entries.length > 0 ) {
				// It's an index column. Use the next index value
				values.push(rowIndexValues.shift());
			} else if ( columnInfo.rowStatus ) {
				// It's the RowStatus column. Replace the action with the appropriate state
				values.push( RowStatus[action] );
			} else if ( "defVal" in columnInfo] ) {
				// Neither index nor RowStatus column, so use the default value
				values.push( columnInfo.defVal );
			} else {
				// Default value was required but not found
				console.log("No defVal defined for column:", columnInfo);
				missingDefVal = true;
				values.push( undefined ); // just for debugging; never gets returned
			}
		}
	);

	// If a default value was missing, we can't auto-create the table row.
	// Otherwise, we're good to go: give 'em the column values.
	return missingDefVal ? undefined : values;
}
```

Automatic instance creation of table rows can be disabled entirely by
setting `createHandler` to null.

### Mapping from MIB files

When a MIB is read from a file using `ModuleStore`'s `loadFromFile`
method, and the providers for that module automatically created via a
call to the store's `getProvidersForModule` method, default values
specified as `DEFVAL` in the MIB are mapped to `defVal` within the
provider, both from scalar definitions and from table columns
definitions.

If the MIB files do not contain some or all of the default values
needed for automatic creation of scalar objects or table rows, the
methods `Mib.setScalarDefaultValue` and `Mib.setTableRowDefaultValues`
may be used to conveniently add defaults after the MIB files are
loaded.

# Application: Module Store

The library supports MIB parsing by providing an interface to a `ModuleStore` instance into which
you can load MIB modules from files, and fetch the resulting JSON MIB module representations.

Additionally, once a MIB is loaded into the module store, you can produce a list of MIB "provider"
definitions that an `Agent` can register (see the `Agent` documentation for more details), so
that you can start manipulating all the values defined in your MIB file right away.

```js
// Create a module store, load a MIB module, and fetch its JSON representation
var store = snmp.createModuleStore ();
store.loadFromFile ("/path/to/your/mibs/SNMPv2-MIB.mib");
var jsonModule = store.getModule ("SNMPv2-MIB");

// Fetch MIB providers, create an agent, and register the providers with your agent
var providers = store.getProvidersForModule ("SNMPv2-MIB");
// Not recommended - but authorization and callback turned off for example brevity
var agent = snmp.createAgent ({disableAuthorization: true}, function (error, data) {});
var mib = agent.getMib ();
mib.registerProviders (providers);

// Start manipulating the MIB through the registered providers using the `Mib` API calls
mib.setScalarValue ("sysDescr", "The most powerful system you can think of");
mib.setScalarValue ("sysName", "multiplied-by-six");
mib.addTableRow ("sysOREntry", [1, "1.3.6.1.4.1.47491.42.43.44.45", "I've dreamed up this MIB", 20]);
```

Then hit those bad boys with your favourite SNMP tools (or library ;-), e.g.

```bash
snmpwalk -v 2c -c public localhost 1.3.6.1
```

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
 * RFC-1215
 * SNMPv2-SMI
 * SNMPv2-CONF
 * SNMPv2-TC
 * SNMPv2-MIB

By default, the `createModuleStore()` function creates a new `ModuleStore` instance with all the base modules pre-loaded. 
However, you can now customize which base modules are loaded by passing an options object:

```js
// Example of selecting only SNMPv2 MIBs
const store = snmp.createModuleStore({
  baseModules: [
    'SNMPv2-SMI',
    'SNMPv2-CONF',
    'SNMPv2-TC',
    'SNMPv2-MIB',
  ],
});
```

The `options` object can contain:

* `baseModules` - An array of module names to use as the base modules. This allows you to explicitly control which MIBs are loaded, which can be useful to avoid unexpected type overrides that might occur with the full set of base modules.

This feature is helpful when dealing with constraints for SNMPv2-TC defined textual conventions like DisplayString that might get preempted by subsequent definitions as plain OCTET STRING in RFC MIBs.

## store.loadFromFile (fileName)

Loads all MIB modules in the given file into the module store.  By convention, there is
typically only a single MIB module per file, but there can be multiple module definitions
stored in a single file.  Loaded MIB modules are then referred to by this API by their
MIB module name, not the source file name.  The MIB module name is the name preceding the 
`DEFINITIONS ::= BEGIN` in the MIB file, and is often the very first thing present in
a MIB file.

Note that if your MIB depends on ("imports") definitions from other MIB files, these must be
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

## store.translate (oid, destinationFormat)

Takes an OID in one of the three supported formats (the library automatically detects the given OID's format):
- **OidFormat.oid** - canonical (numerical) OID format e.g. 1.3.6.1.2.1.1.1
- **OidFormat.path** - named OID path format e.g. iso.org.dod.internet.mgmt.mib-2.system.sysDescr
- **OidFormat.module** - module-qualified format e.g. SNMPv2-MIB::sysDescr

Returns the given OID translated to the provided destination format - also one of the above three formats.

For example:

```js
var numericOid = store.translate ('SNMPv2-MIB::sysDescr', snmp.OidFormat.oid);
    => '1.3.6.1.2.1.1.1'
var moduleQualifiedName = store.translate ('1.3.6.1.2.1.1.1', snmp.OidFormat.module);
    => 'SNMPv2-MIB::sysDescr'
var namedOid = store.translate ('1.3.6.1.2.1.1.1', snmp.OidFormat.path);
    => 'iso.org.dod.internet.mgmt.mib-2.system.sysDescr'
```

# Agent Forwarder Module

An `Agent` instance, when created, in turn creates an instance of the `Forwarder` class.
There is no direct API call to create a `Forwarder` instance; this creation is the
responsibility of the agent.  An agent always has one and only one `Forwarder` instance.
The agent's `Forwarder` instance is accessed through the `agent.getForwarder ()` call.

A `Forwader` is what RFC 3413 terms a "Proxy Forwarder Application".  It maintains a list
of "proxy" entries, each of which configures a named SNMPv3 context name to enable access 
to a given target host with the given user credentials.  The `Forwarder` supports proxying
of SNMPv3 sessions only.

```js
var forwarder = agent.getForwarder ();
forwarder.addProxy({
    context: "slatescontext",
    host: "bedrock",
    user: {
        name: "slate",
        level: snmp.SecurityLevel.authNoPriv,
        authProtocol: snmp.AuthProtocols.sha,
        authKey: "quarryandgravel"
    }
});
```

Now requests to the agent with the context "slatescontext" supplied will be forwarded to host "bedrock",
with the supplied credentials for user "slate".

You can query the proxy with a local agent user (added with the agent's `Authorizer` instance).
Assuming your proxy runs on localhost, port 161, you could add local user "fred", and access the proxy
with the new "fred" user.

```js
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

# Application: AgentX Subagent

The AgentX subagent implements the functionality specified in RFC 2741 to become a "subagent"
of an AgentX "master agent".  The goal of AgentX is to extend the functionality of an existing
"master" SNMP agent by a separate "subagent" registering parts of the MIB tree that it would
like to manage for the master agent.

The AgentX subagent supports the generation of all but two of the "administrative" PDU types, all of
which are sent from the subagent to the master agent:
* **Open PDU** - opens a new session with a master agent
* **Close PDU** - closes an existing session with the master agent
* **Register PDU** - registers a MIB region to control with the master agent
* **Unregister PDU** - unregisters a previously registered MIB region with the master agent
* **Notify PDU** - sends a notification to the master agent
* **Ping PDU** - sends a "ping" to confirm the master agent is still available
* **AddAgentCaps PDU** - adds an agent capability to the master agent's sysORTable
* **RemoveAgentCaps PDU** - remove a previously added agent capability from the master agent's sysORTable

The two unsupported "administrative" PDU types are:
* **IndexAllocate PDU** - request allocation of an index from a table whose index is managed by a master agent
* **IndexDeallocate PDU** - request deallocation of a previously allocated index from a master agent's table

These are unsupported as they do not fit the current MIB provider registration model, which
only supports registering scalars and entire tables.  These could be supported in the future
by further generalizing the registration model to support table row registration.

The subagent responds to all "request processing" PDU types relevant to a Command Responder
application, which are received from the master agent:

 * **Get PDU** - requests exactly matched OID instances
 * **GetNext PDU** - requests lexicographically "next" OID instances in the MIB tree
 * **GetBulk PDU** - requests a series of "next" OID instances in the MIB tree
 * **TestSet PDU** - tests a list of "set" operations to be committed as a single transaction
 * **CommitSet PDU** - commits a list of "set" operations as a single transaction
 * **UndoSet PDU** - undoes a list of "set" operations as a single transaction
 * **CleanupSet PDU** - ends a "set" transaction

As per RFC 2741, all of these except the **CleanupSet** PDU return a **Response** PDU to the master agent.

Like the SNMP agent, the AgentX subagent maintains is a `Mib` instance, the API of which is
detailed in the [Mib Module](#mib-module) section above.  The subagent allows the MIB to be queried
and manipulated through the API, as well as queried and manipulated through the AgentX interface with
the above "request processing" PDUs (which are produced by the master agent when its SNMP interface
is invoked).

It is important that MIB providers are registered using the subagent's `subagent.registerProvider ()`
call (outlined below), and not using `subagent.getMib ().registerProvider ()`, as the subagent needs
to both register the provider on its internal `Mib` object, *and* send a Register PDU to the master
agent for the provider's MIB region.  The latter step is skipped if registering the provider directly
on the MIB object.

## snmp.createSubagent (options)

The `createSubagent ()` function instantiates and returns an instance of the `Subagent`
class:

```js
// Default options
var options = {
    master: "localhost",
    masterPort: 705,
    timeout: 0,
    description: "Node net-snmp AgentX sub-agent",
    mibOptions: {},
    mib: undefined
};

subagent = snmp.createSubagent (options);
```

The `options` parameter is a mandatory object, possibly empty, and can contain the following fields:

 * `master` - the host name or IP address of the master agent, which the subagent
 connects to.
 * `masterPort` - the TCP port for the subagent to connect to the master agent on -
 defaults to 705.
 * `timeout` - set the session-wide timeout on the master agent - defaults to 0, which
 means no session-wide timeout is set.
 * `description` - a textual description of the subagent.
 * `mibOptions` - n MIB options object that is passed to the `Mib` instance - see the MIB section
 for further details on this - defaults to the empty object.
 * `mib` - sets the agent's singleton `Mib` instance.  If not supplied, the agent creates itself
 a new empty `Mib` singleton.  If supplied, the `Mib` instance needs to be created and populated as
 per the [Mib Module](#mib-module) section.


## subagent.getMib ()

Returns the agent's singleton `Mib` instance, which is automatically created on creation
of the subagent, and which holds all of the management data for the subagent.

## subagent.open (callback)

Sends an `Open` PDU to the master agent to open a new session, invoking the callback on
response from the master.

## subagent.close (callback)

Sends a `Close` PDU to the master agent to close the subagent's session to the master,
invoking the callback on response from the master.

## subagent.registerProvider (provider, callback)

See the `Mib` class `registerProvider()` call for the definition of a provider.  The format
and meaning of the `provider` object is the same for this call.  This sends a `Register` PDU to
the master to register a region of the MIB for which the master will send "request processing"
PDUs to the subagent.  The supplied `callback` is used only once, on reception of the
subsequent `Response` PDU from the master to the `Register` PDU.  This is not to be confused
with the `handler` optional callback on the provider definition, which is invoked for any
"request processing" PDU received by the subagent for MIB objects in the registered MIB region.

## subagent.unregisterProvider (name, callback)

Unregisters a previously registered MIB region by the supplied name of the provider.  Sends
an `Unregister` PDU to the master agent to do this.  The supplied `callback` is used only
once, on reception of the subsequent `Response` PDU from the master to the `Unregister` PDU.

## subagent.registerProviders ( [definitions], callback )

Convenience method to register an array of providers in one call.  Simply calls `registerProvider()`
for each provider definition in the array.  The `callback` function is called once for each
provider registered.

## subagent.getProviders ()

Returns an object of provider definitions registered with the MIB, indexed by provider name.

## subagent.getProvider (name)

Returns a single registered provider object for the given name.

## subagent.addAgentCaps (oid, descr, callback)

Adds an agent capability - consisting of `oid` and `descr` - to the master agent's sysORTable.
Sends an `AddAgentCaps` PDU to the master to do this.  The supplied `callback` is called on
reception of the subsequent `Response` PDU from the master to the `AddAgentCaps` PDU.

## subagent.removeAgentCaps (oid, callback)

Remove an previously added capability from the master agent's sysORTable.  Sends a `RemoveAgentCaps`
PDU to the master to do this.  The supplied `callback` is called on reception of the subsequent
`Response` PDU from the master to the `RemoveAgentCaps` PDU.

## subagent.notify (typeOrOid, varbinds, callback)

Sends a notification to the master agent using a `Notify` PDU.  The notification takes the same
form as outlined in the `session.inform()` section above and also in RFC 2741 Section 6.2.10,
which is creating two varbinds that are always included in the notification:
- sysUptime.0 (1.3.6.1.2.1.1.3.0) - containing the subagent's uptime
- snmpTrapOID.0 (1.3.6.1.6.3.1.1.4.1.0) - containing the supplied OID (or supplied `snmp.TrapType` value)

The optional `varbinds` list is an additional list of varbind objects to append to the above
two varbinds.  The supplied `callback` is called on reception of the subsequent
`Response` PDU from the master to the `Notify` PDU.

## subagent.ping (callback)

Sends a "ping" to the master agent using a `Ping` PDU, to confirm that the master agent is still
responsive.  The supplied `callback` is called on reception of the subsequent
`Response` PDU from the master to the `Ping` PDU.

## subagent.on ("close", callback)

The `close` event is emitted by the subagent when its underlying TCP socket is closed.

No arguments are passed to the callback.

The following example prints a message to the console when a subagent's
underlying TCP socket is closed:

```js
subagent.on ("close", function () {
    console.log ("Subagent socket closed");
});
```

## subagent.on ("error", callback)

The `error` event is emitted by the subagent when its underlying TCP socket emits an error.

The following argument will be passed to the `callback` function:

 * `error` - An instance of the `Error` class, the exposed `message` attribute
   will contain a detailed error message.

The following example prints a message to the console when an error occurs
with a subagent's underlying TCP socket, and the subagent is then closed:

```js
subagent.on ("error", function (error) {
    console.log (error.toString ());
    subagent.close ();
});
```


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

## Version 1.1.18 - 15/05/2016

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

## Version 2.5.3 - 22/02/2020

 * Add backoff option

## Version 2.5.4 - 22/03/2020

 * Fix agent crash with unexpected GetNext start OID

## Version 2.5.5 - 31/03/2020

 * Fix double report PDU time synchronisation handling

## Version 2.5.6 - 02/04/2020

 * Fix agent handling of GetNext from off-tree OID

## Version 2.5.7 - 09/04/2020

 * Handle periodic report PDUs on a long running session

## Version 2.5.8 - 13/04/2020

 * Fix OID and namespace calculations in MIB parser

## Version 2.5.9 - 17/04/2020

 * Fix Windows absolute path for reading MIB files

## Version 2.5.10 - 17/04/2020

 * Improve SNMPv3 error messages

## Version 2.5.11 - 21/04/2020

 * Receiver close fix and receiver example fix

## Version 2.5.12 - 24/04/2020

 * Add backwardsGetNexts option for handling of errant GetNexts

## Version 2.6.0 - 27/04/2020

 * Add AgentX subagent

## Version 2.6.1 - 02/05/2020

 * Fix backwardsGetNexts session option and fix null MIB entry reading

## Version 2.6.2 - 05/05/2020

 * Add missing agent.close() API call

## Version 2.6.3 - 07/05/2020

 * Add set value to MibRequest and fix backwardsGetNexts

## Version 2.6.4 - 09/05/2020

 * Improve socket error handling

## Version 2.6.5 - 26/05/2020

 * Add agent support for handling short OIDs and noSuchInstance

## Version 2.6.6 - 29/05/2020

 * Fix async mibRequest handler

## Version 2.6.7 - 01/06/2020

 * Add support for zero-index rows in agent tables

## Version 2.6.8 - 08/07/2020

 * Fix GetBulk async mibRequest handling

## Version 2.7.0 - 09/07/2020

 * Add MIB create, add MIB setting for agent, and fix MIB error response crash

## Version 2.7.1 - 17/07/2020

 * Fix AgentX subagent noSuchInstance crash

## Version 2.7.2 - 02/09/2020

 * Declare variables to fix transpile errors

## Version 2.7.3 - 02/09/2020

 * MIB getobject callback convention update

## Version 2.7.4 - 02/09/2020

 * Fix columnNumber check in getColumnProvider

## Version 2.7.5 - 05/09/2020

 * Fix parsing of iso.org

## Version 2.7.6 - 05/09/2020

 * Add revisions/descriptions MIB parsing

## Version 2.7.7 - 07/09/2020

 * Fix double callback invocation on callback error

## Version 2.8.0 - 09/09/2020

 * Add eslint rules and conformance, fix AgentX subagent Unregister

## Version 2.8.1 - 09/09/2020

 * Add Travis CI configuration

## Version 2.9.0 - 12/09/2020

 * Add simple access control model for agent

## Version 2.9.1 - 17/09/2020

 * Add MIB integer enumeration constraints for providers and SetRequests

## Version 2.9.2 - 25/09/2020

 * Fix MIB parsing of files leading with a comment

## Version 2.9.3 - 12/10/2020

 * Add bind address support for agent

## Version 2.9.4 - 14/10/2020

 * Fix getBulk documentation errors

## Version 2.9.5 - 15/10/2020

 * Add syntax definitions to README code blocks

## Version 2.9.6 - 24/10/2020

 * Fix providers for MIB table at end of MIB file

## Version 2.9.7 - 06/11/2020

 * Add README.cn.md for Chinese language

## Version 2.9.8 - 21/11/2020

 * Add support for BER long-form length encoding

## Version 2.10.0 - 02/12/2020

 * Add message security level checks against user security level

## Version 2.10.1 - 25/12/2020

 * Fix UNITS key recognition in MIB parser

## Version 3.0.0 - 30/12/2020

 * Add MAX-ACCESS provider and agent support

## Version 3.0.1 - 01/01/2021

 * Fix error indexing for failed varbinds from agent

## Version 3.0.2 - 03/01/2021

 * Fix agent hang on GetBulk with non-repeaters greater than varbind length

## Version 3.0.3 - 03/01/2021

 * Add agent errorStatus signalling support

## Version 3.0.4 - 06/01/2021

 * Prevent non-accessible index objects from being columns in table rows

## Version 3.0.5 - 08/01/2021

 * Fix MIB file reading from relative paths

## Version 3.0.6 - 10/01/2021

 * Fix MIB parsing of tab characters

## Version 3.0.7 - 10/01/2021

 * Fix MIB parsing of quoted unmatched brackets

## Version 3.1.0 - 14/01/2021

 * Add RowStatus support to agent tables

## Version 3.1.1 - 14/01/2021

 * Fix scalar default createHandler

## Version 3.2.0 - 22/01/2021

 * Add row index, row and column to agent table callback info

## Version 3.2.1 - 23/01/2021

 * Fix agent scalar read-create and set

## Version 3.2.2 - 23/01/2021

 * Fix agent state for row deletion to empty table

## Version 3.2.3 - 23/01/2021

 * Fix return from agent set outside of constraints to WrongValue

## Version 3.3.0 - 24/01/2021

 * Add range and size constraints support to MIB variables

## Version 3.3.1 - 25/01/2021

 * Add range and size constraints to MIB parsing and provider generation

## Version 3.3.2 - 26/01/2021

 * Add range and size constraints documentation

## Version 3.3.3 - 27/01/2021

 * Add column position to agent varbind callback

## Version 3.4.0 - 27/01/2021

 * Add 256-bit AES encryption

## Version 3.4.1 - 28/01/2021

 * Add oldValue to agent callback info and convert buffers to strings

## Version 3.4.2 - 05/02/2021

 * Add error codes to ResponseInvalidError

## Version 3.4.3 - 06/02/2021

 * Add documentation for ResponseInvalidError error codes

## Version 3.5.0 - 28/02/2021

 * Add engineID option to v3 session

## Version 3.5.1 - 28/02/2021

 * Fix MIB parsing of sized integers without whitespace

## Version 3.5.2 - 02/03/2021

 * Fix MIB table index handling of Buffer type

## Version 3.5.3 - 22/08/2021

 * Fix error with empty varbind array in walk

## Version 3.5.4 - 24/08/2021

 * Align accessible-for-notify row cell behaviour with not-accessible behaviour

## Version 3.5.5 - 29/09/2021

 * Add missing return in getbulk feedCb callback non-repeaters error condition

## Version 3.5.6 - 20/10/2021

 * Fix GetNext OID calculation for off-tree OIDs

## Version 3.5.7 - 20/11/2021

 * Fix handing of null varbinds in walk

## Version 3.5.8 - 24/11/2021

 * Fix processing of negative integers larger than 32 bits

## Version 3.6.0 - 18/02/2022

 * Add calculated key cache to remove authNoPriv and authPriv performance bottleneck

## Version 3.6.1 - 21/03/2022

 * Add v3 context to non-initial PDUs

## Version 3.6.2 - 07/04/2022

 * Add option for receiver to receive client authentication identity

## Version 3.6.3 - 26/04/2022

 * Fix logic for v3 time synchronization requirement

## Version 3.6.4 - 14/05/2022

 * Ignore mismatched returned OIDs by default

## Version 3.7.0 - 04/06/2022

 * Add SHA-2 authentication support (SHA-224, SHA-256, SHA-384, SHA-512)

## Version 3.7.1 - 05/06/2022

 * Fix DES decrypt corruption issue

## Version 3.7.2 - 05/06/2022

 * Improve getBulk response handling

## Version 3.8.0 - 07/06/2022

 * Fix 32-bit unsigned integer writing and add integer range checking

## Version 3.8.1 - 07/06/2022

 * Add bit string type to varbind reading

## Version 3.8.2 - 21/06/2022

 * Fix PDU error status field writing

## Version 3.8.3 - 12/09/2022

 * Fix incorrect user level assignment

## Version 3.8.4 - 29/09/2022

 * Fix IpAddress byte array set request handling

## Version 3.9.0 - 11/12/2022

 * Add ProcessingError to handle agent/receiver decode failures

## Version 3.9.1 - 16/03/2023

 * Fix MIB parsing of unclosed brackets in comments

## Version 3.9.2 - 26/04/2023

 * Fix MIB parsing of non-comments in descriptions and unmatched quotations

## Version 3.9.3 - 28/04/2023

 * Add AgentX subagent "error" and "close" events

## Version 3.9.4 - 26/05/2023

 * Fix syntax constraints tokenization and fix applying of size constraints

## Version 3.9.5 - 30/05/2023

 * Normalize whitespace parsing for OBJECT IDENTIFIER value

## Version 3.9.6 - 30/05/2023

 * Add type constraint support for textual conventions

## Version 3.9.7 - 13/07/2023

 * Add tolerance for reading malformed 32-bit unsigned integers

## Version 3.9.8 - 13/01/2024

 * Fix subtree callback termination

## Version 3.9.9 - 17/01/2024

 * Add SMIv1 integer enumeration support

## Version 3.10.0 - 17/01/2024

 * Add numeric/named OID translate function

## Version 3.10.1 - 30/01/2024

 * Fix table column type in provider definition with column type constraints

## Version 3.10.2 - 05/02/2024

 * Add MIB parsing support for OID values with intermediate entries in list

## Version 3.10.3 - 05/02/2024

 * Add MIB parsing support for final member of OID value list containing identifier/descriptor pair

## Version 3.10.4 - 22/03/2024

 * Add MIB parsing support for middle member of OID value list containing identifier only

## Version 3.11.0 - 23/03/2024

 * Fix parent object retrieval to respect MIB module imports

## Version 3.11.1 - 30/03/2024

 * Add error status and index handling to AgentX subagent

## Version 3.11.2 - 03/04/2024

 * Add provider to MIB request

## Version 3.12.0 - 28/06/2024

 * Add multiple socket listener support for agent and receiver

## Version 3.12.1 - 21/08/2024

 * Fix SNMPv1 session walk infinite loop condition

## Version 3.13.0 - 03/09/2024

 * Add support for out-of-order MIB dependencies

## Version 3.13.1 - 03/09/2024

 * Add close callback for agent and receiver

## Version 3.13.2 - 05/09/2024

 * Fix AgentX signed integer writing

## Version 3.14.0 - 10/09/2024

 * Add support for SMIv1 defined types and TRAP-TYPE SMIv1 macro

## Version 3.14.1 - 11/09/2024

 * Add RFC-1215 to base MIB modules to provide TRAP-TYPE macro

## Version 3.15.0 - 14/09/2024

 * Change return of undefined or null MIB values to NoSuchInstance

## Version 3.15.1 - 12/10/2024

 * Fix bundler failure due to unnecessary string length assignment

## Version 3.15.2 - 03/12/2024

 * Change return of non-existing OIDs under table from NoSuchObject to NoSuchInstance

## Version 3.15.3 - 04/12/2024

 * Fix agent SNMP SetRequest for OIDs

## Version 3.16.0 - 23/12/2024

 * Add MIB object validation to set/add MIB API calls

## Version 3.16.1 - 01/01/2025

 * Fix loading of MIB directory paths with periods

## Version 3.17.0 - 01/01/2025

 * Relax validation of unknown object types

## Version 3.18.0 - 06/01/2025

 * Add MIB option to add scalar MIB object on scalar provider registration

## Version 3.18.1 - 06/01/2025

 * Add agent option key for MIB options

## Version 3.18.2 - 06/01/2025

 * Add conversion of scalar defVal enumeration name to number on assignment

## Version 3.19.0 - 06/02/2025

 * Remove deprecated isArray call and fix agent string constraints check

## Version 3.19.1 - 03/03/2025

 * Fix integer constraints check

# Version 3.19.2 - 06/03/2025

 * Fix integer and string constraints check on cast

# Version 3.20.0 - 06/03/2025

 * Fix set value for counter, gauge and unsigned integer types

# Version 3.20.1 - 26/04/2025

 * Update documentation with compatibility note on DES and recent Node.js versions

# Version 3.21.0 - 26/04/2025

 * Add AgentX subagent mib and mibOptions on initialization

# Version 3.21.1 - 26/04/2025

 * Add better defval type handling, improved debug handling and simple agent example

# Version 3.21.2 - 27/04/2025

 * Add custom base module list

# Version 3.22.0 - 27/04/2025

 * Fix incorrect SNMPv3 engineID handling

 * Add custom base module list

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
