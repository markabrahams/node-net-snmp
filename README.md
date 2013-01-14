
# net-snmp - [homepage](http://re-tool.org)

This module implements version 1 of the [Simple Network Management Protocol
(SNMP)](http://en.wikipedia.org/wiki/Simple_Network_Management_Protocol).
Version 2c support will be available shortly.

This module is installed using [Node Package Manager
(NPM)](https://npmjs.org/):

	npm install net-snmp

It then can be loaded using the `require()` function:

	var snmp = require ("snmp");

Sessions to remote hosts can then be created:

	var session = snmp.createSession ("127.0.0.1", "public");

Use the session to make SNMP get, get-next and set requests, and send SNMP
traps:

	var oids = ["1.3.6.1.2.1.1.5.0", "1.3.6.1.2.1.1.6.0"];
	
	session.get (oids, function (error, varbinds) {
		if (error) {
			console.error (error);
		} else {
			for (var i = 0; i < varbinds.length; i++)
				console.log (varbinds[i].oid + " = " + varbinds[i].value);
		}
	});

	session.trap (snmp.TrapType.LinkDown, function (error) {
		if (error)
			console.error (error);
	});

# Constants

The following sections describe constants exported by this module.

## snmp.ErrorStatus

This object contains constants for all valid values the error-status field in
response PDUs could hold.  When parsing a PDU the error-index field contains a
value not defined in this object the constant `snmp.ErrorStatus.GeneralError`
will be used instead.

The following constants are defined in this object:

 * `NoError`
 * `TooBig`
 * `NoSuchName`
 * `BadValue`
 * `ReadOnly`
 * `GeneralError`

## snmp.TrapType

This object contains constants used to specify a type of SNMP trap.  Currently
this is only used by the `trap()` method exposed by the `Session` class.

The following constants are defined in this object:

 * `ColdStart`
 * `WarmStart`
 * `LinkDown`
 * `LinkUp`
 * `AuthenticationFailure`
 * `EgpNeighborLoss`
 * `EnterpriseSpecific`

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

# OID Strings & Varbinds

Some parts of the API accept simple OID strings, e.g.:

	var oid = "1.3.6.1.2.1.1.5.0";

OID strings are typically referred as "OID" or "OIDs".

Other parts take an OID string, it's type and value.  This is collectively
referred to as a varbind, and is specified as an object, e.g.:

	var varbind = {
		oid: "1.3.6.1.2.1.1.5.0",
		type: snmp.ObjectType.OctetString,
		value: "host1"
	};

# Error Handling

SNMP request and trap functions take a mandatory callback function.  This
function is called once a request has been processed.  This could be because
an error occurred when processing the request, a trap has been dispatched or a
successful response was received.

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
a sub-class described in one of the following sections.

## snmp.RequestFailedError

This error indicates the remote host failed to process the request.  The
exposed `message` attribute will contain a detailed string indicating what the
error was.

This error also exposes a `status` attribute which contains the error-index
value from a response PDU.  This will be one of the constants defined in the
`snmp.ErrorStatus` object.

## snmp.RequestInvalidError

This error indicates a failure to render a request message or PDU before it
could be sent.  The error can also indicate that a parameter provided was
invalid.  The exposed `message` attribute will contain a detailed string
indicating what the error was.

## snmp.RequestTimdOutError

This error states that no response was received for a particular request.  The
exposed `message` attribute will typically contain the value `Request timed
out`.

## snmp.ResponseInvalidError

This error indicates a failure to parse a received response message or PDU.
The exposed `message` attribute will contain a detailed string indicating what
the error was.

# Using This Module

All SNMP requests are made using an instance of the `Session` class.  This
module exports the `createSession()` function, which is used to create new
`Session` objects.

## snmp.createSession ([target], [community], [options])

The `createSession()` function instantiates and returns an instance of the
`Session` class:

	var options = {
		retries: 1,
		timeout: 5000,
		port: 161,
		trapPort: 162
	};
	
	var session = snmp.createSession ("127.0.0.1", "public", options);

The optional `target` parameter defaults to `127.0.0.1`.  The optional
`community` parameter defaults to `public`.  The optional `options` parameter
is an object, and can contain the following items:

 * `retries` - Number of times to re-send a request, defaults to 1
 * `timeout` - Number of milliseconds to wait for a response before re-trying
               or failing, defaults to 5000
 * `port` - UDP port to send requests too, defaults to 161
 * `trapPort` - UDP port to send traps too, defaults to 162

The returned object can be used to perform SNMP requests and send traps to a
remote host.

## session.get (oids, callback)

The `get()` method fetches the value for one or more OIDs from a remote host.
The `oids` parameter is an array of OID strings.

The `callback` function is called once the request is complete.  The following
arguments will be passed to the `callback` function:

 * `error` - Instance of the Error class or a sub-class, or `null` if no error
             occurred
 * `varbinds` - Array of varbinds, will not be provided if an error occurred

The varbind in position N in the `varbinds` array will correspond to the OID
in position N in the `oids` array in the request.

The following example fetches values for the sysName (1.3.6.1.2.1.1.5.0) and
sysLocation (1.3.6.1.2.1.1.6.0) OIDs:

	var oids = ["1.3.6.1.2.1.1.5.0", "1.3.6.1.2.1.1.6.0"];
	
	session.get (oids, function (error, varbinds) {
		if (error) {
			console.error (error.toString ());
		} else {
			for (var i = 0; i < varbinds.length; i++)
				console.log (varbinds[i].oid + "|" + varbinds[i].value);
		}
	});

## session.getNext (oids, callback)

The `getNext()` method fetches the value for the OIDs lexicographically
following one or more OIDs in the MIB tree from a remote host.  The `oids`
parameter is an array of OID strings.

The `callback` function is called once the request is complete.  The following
arguments will be passed to the `callback` function:

 * `error` - Instance of the Error class or a sub-class, or `null` if no error
             occurred
 * `varbinds` - Array of varbinds, will not be provided if an error occurred

The varbind in position N in the `varbinds` array will correspond to the OID
in position N in the `oids` array in the request.

The following example fetches values for the next OIDs following the
sysObjectID (1.3.6.1.2.1.1.1.0) and sysName (1.3.6.1.2.1.1.4.0) OIDs:

	var oids = [
		"1.3.6.1.2.1.1.1.0",
		"1.3.6.1.2.1.1.4.0"
	];
	
	session.getNext (oids, function (error, varbinds) {
		if (error) {
			console.error (error.toString ());
		} else {
			for (var i = 0; i < varbinds.length; i++)
				console.log (varbinds[i].oid + "|" + varbinds[i].value);
		}
	});

## session.set (varbinds, callback)

The `set()` method sets the value of one or more OIDs on a remote host.  The
`varbinds` parameter is an array of varbind objects.

The `callback` function is called once the request is complete.  The following
arguments will be passed to the `callback` function:

 * `error` - Instance of the Error class or a sub-class, or `null` if no error
             occurred
 * `varbinds` - Array of varbinds, will not be provided if an error occurred

The varbind in position N in the `varbinds` array will correspond to the
varbind in position N in the `varbinds` array in the request.  The remote host
should echo back varbinds and their values as specified in the request, and
the `varbinds` array will contain each varbind as sent back by the remote host.

The following example sets the value of the sysName (1.3.6.1.2.1.1.4.0) and
sysLocation (1.3.6.1.2.1.1.6.0) OIDs:

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
			for (var i = 0; i < varbinds.length; i++)
				console.log (varbinds[i].oid + "|" + varbinds[i].value);
		}
	});

## session.trap (typeOrOid, [varbinds], [agentAddr], callback)

The `trap()` method sends a SNMP trap to a remote host.  The `typeOrOid`
parameter can be one of two types; one of the constants defined in the
`snmp.TrapType` object (excluding the `snmp.TrapType.EnterpriseSpecific`
constant), or an OID string.  When a constant is specified the following
fields are set in the trap:

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

The `varbinds` parameter is an optional array of varbinds to include in the
trap, and defaults to the empty array `[]`.  The `agentAddr` parameter is
optional, and defaults to `127.0.0.1`.

The `callback` function is called once the trap has been sent, or an error
occurred.  The following arguments will be passed to the `callback` function:

 * `error` - Instance of the Error class or a sub-class, or `null` if no error
 occurred

The following example sends an enterprise specific trap to a remote host, and
includes the sysName (1.3.6.1.2.1.1.5.0) varbind in the trap.  Before the trap
is sent the `agentAddr` field is calculated using DNS to resolve the hostname
of the local host:

	var enterpriseOid = "1.3.6.1.4.1.2000.1"; // we made this up, but it may be
	valid
	
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

The following example sends a generic link-down trap to a remote host, it does
not include any varbinds or specify the `agentAddr` parameter:

	session.trap (snmp.TrapType.LinkDown, function (error) {
		if (error)
			console.error (error);
	});

## session.walk (oids, callback)

This `walk()` method is not actually implemented by the API.  The main reason
being that the semantics of the callback function when more than one OID is
specified in the request is ambiguous.

Instead of exposing a `walk()` method an example implementation which supports
walking a single OID is provided:

	var oid = "1.3.6.1";
	
	function responseCb (error, varbinds) {
		if (error) {
			// When we reach the end of the MIB view the remote host will respond
			// with the error-index field set to NoSuchName, this will be passed
			// to this callback as a RequestFailedError with status set to the
			// constant snmp.ErrorStatus.NoSuchName, this indicates we can stop
			// the performing get-next-requests:
			if (error instanceof snmp.RequestFailedError) {
				if (error.status != snmp.ErrorStatus.NoSuchName) {
					console.error (error.toString ());
				}
			} else {
				console.error (error.toString ());
			}
		} else {
			var oids = [];
			for (var i = 0; i < varbinds.length; i++) {
				console.log (varbinds[i].oid + "|" + varbinds[i].type + "|"
						+ varbinds[i].value);
						
				// Use the varbinds returned to work out which OIDs to specify in
				// the next get-next-request:
				oids.push (varbinds[i].oid);
			}
			walk (oids, cb);
		}
	}
	
	function walk (oid, responseCb) {
		// We only support a single OID so the first call to this function will
		// be performed using an OID string, the getNext() method wants an array
		// so we'll implicitly convert it here for the initial request, all
		// other requests made by the responseCb() callback above will be
		// performed using OID arrays
		if (typeof oid == "string")
			oid = [oid];
		session.getNext (oid, responseCb);
	}
	
	walk (oid, responseCb);

# Example Programs

Example programs are included under the modules `bin` directory.

# Bugs & Known Issues

None, yet!

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
