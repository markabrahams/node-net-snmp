
// Copyright 2013 Stephen Vickers

var ber = require ('asn1').Ber;
var dgram = require ("dgram");
var util = require ("util");

/*****************************************************************************
 ** Constants
 **/

function _expandConstantObject (object) {
	var keys = [];
	for (key in object)
		keys.push (key);
	for (var i = 0; i < keys.length; i++)
		object[object[keys[i]]] = parseInt (keys[i]);
}

var ErrorStatus = {
	0: "NoError",
	1: "TooBig",
	2: "NoSuchName",
	3: "BadValue",
	4: "ReadOnly",
	5: "GeneralError",
	6: "NoAccess",
	7: "WrongType",
	8: "WrongLength",
	9: "WrongEncoding",
	10: "WrongValue",
	11: "NoCreation",
	12: "InconsistentValue",
	13: "ResourceUnavailable",
	14: "CommitFailed",
	15: "UndoFailed",
	16: "AuthorizationError",
	17: "NotWritable",
	18: "InconsistentName"
};

_expandConstantObject (ErrorStatus);

var ObjectType = {
	1: "Boolean",
	2: "Integer",
	4: "OctetString",
	5: "Null",
	6: "OID",
	64: "IpAddress",
	65: "Counter",
	66: "Gauge",
	67: "TimeTicks",
	68: "Opaque",
	70: "Counter64",
	128: "NoSuchObject",
	129: "NoSuchInstance",
	130: "EndOfMibView"
};

_expandConstantObject (ObjectType);

ObjectType.Integer32 = ObjectType.Integer;
ObjectType.Counter32 = ObjectType.Counter;
ObjectType.Gauge32 = ObjectType.Gauge;
ObjectType.Unsigned32 = ObjectType.Gauge32;

var PduType = {
	160: "GetRequest",
	161: "GetNextRequest",
	162: "GetResponse",
	163: "SetRequest",
	164: "Trap",
	165: "GetBulkRequest",
	166: "InformRequest",
	167: "TrapV2",
	168: "Report"
};

_expandConstantObject (PduType);

var TrapType = {
	0: "ColdStart",
	1: "WarmStart",
	2: "LinkDown",
	3: "LinkUp",
	4: "AuthenticationFailure",
	5: "EgpNeighborLoss",
	6: "EnterpriseSpecific"
};

_expandConstantObject (TrapType);

var Version1 = 0;
var Version2c = 1;

/*****************************************************************************
 ** Exception class definitions
 **/

function ResponseInvalidError (message) {
	this.name = "ResponseInvalidError";
	this.message = message;
}
util.inherits (ResponseInvalidError, Error);

function RequestInvalidError (message) {
	this.name = "RequestInvalidError";
	this.message = message;
}
util.inherits (RequestInvalidError, Error);

function RequestFailedError (message, status) {
	this.name = "RequestFailedError";
	this.message = message;
	this.status = status;
}
util.inherits (RequestFailedError, Error);

function RequestTimedOutError (message) {
	this.name = "RequestTimedOutError";
	this.message = message;
}
util.inherits (RequestTimedOutError, Error);

/*****************************************************************************
 ** OID and varbind helper functions
 **/

function isVarbindError (varbind) {
	if (varbind.type == ObjectType.NoSuchObject
			|| varbind.type == ObjectType.NoSuchInstance
			|| varbind.type == ObjectType.EndOfMibView)
		return true;
	else
		return false;
}

function varbindError (varbind) {
	return (ObjectType[varbind.type] || "NotAnError") + ": " + varbind.oid;
}

function oidFollowsOid (oidString, nextString) {
	var oid = oidString.split (".");
	var next = nextString.split (".");
	var i = 0;
	
	while (1) {
		if (oid.length > i) {
			if (next.length > i) {
				var oid_i = parseInt (oid[i]);
				var next_i = parseInt (next[i]);
				if (next_i > oid_i) {
					return true;
				} else if (next_i < oid_i) {
					return false;
				}
			} else {
				return false;
			}
		} else if (next.length > i) {
			return true;
		} else {
			return false;
		}
		i++;
	}
};

/**
 ** Some SNMP agents produce integers on the wire such as 00 ff ff ff ff.
 ** The ASN.1 BER parser we use throws an error when parsing this, which we
 ** believe is correct.  So, we decided not to bother the "asn1" developer(s)
 ** with this, instead opting to work around it here.
 **
 ** If an integer is 5 bytes in length we check if the first byte is 0, and if so
 ** simply drop it and parse it like it was a 4 byte integer, otherwise throw
 ** an error since the integer is too large.
 **/

function readInt (buffer) {
	var value = readUint (buffer);
	
	if (value & 0x80000000)
		value = 0 - (value & 0x7fffffff);
	
	return value;
}

function readUint (buffer) {
	buffer.readByte ();
	var length = buffer.readByte ();

	if (length > 5) {
		 throw new RangeError ("Integer too long '" + length + "'");
	} else if (length == 5) {
		if (buffer.readByte () !== 0)
			throw new RangeError ("Integer too long '" + length + "'");
		length = 4;
	}

	value = 0;
	for (var i = 0; i < length; i++) {
		value *= 256;
		value += buffer.readByte ();
	}
	
	return value;
}

function readUint64 (buffer) {
	var value = buffer.readString (ObjectType.Counter64, true);
	
	if (value.length > 8)
		throw new RequestInvalidError ("64 bit unsigned integer too long '"
				+ value.length + "'")
	
	return value;
}

function readVarbinds (buffer, varbinds) {
	buffer.readSequence ();
	
	while (1) {
		buffer.readSequence ();
		var oid = buffer.readOID ();
		var type = buffer.peek ();
		
		if (type == null)
			break;
		
		var value;
		
		if (type == ObjectType.Boolean) {
			value = buffer.readBoolean ();
		} else if (type == ObjectType.Integer) {
			value = readInt (buffer);
		} else if (type == ObjectType.OctetString) {
			value = buffer.readString (null, true);
		} else if (type == ObjectType.Null) {
			buffer.readByte ();
			buffer.readByte ();
			value = null;
		} else if (type == ObjectType.OID) {
			value = buffer.readOID ();
		} else if (type == ObjectType.IpAddress) {
			var bytes = buffer.readString (ObjectType.IpAddress, true);
			if (bytes.length != 4)
				throw new ResponseInvalidError ("Length '" + bytes.length
						+ "' of IP address '" + bytes.toString ("hex")
						+ "' is not 4");
			value = bytes[0] + "." + bytes[1] + "." + bytes[2] + "." + bytes[3];
		} else if (type == ObjectType.Counter) {
			value = readUint (buffer);
		} else if (type == ObjectType.Gauge) {
			value = readUint (buffer);
		} else if (type == ObjectType.TimeTicks) {
			value = readUint (buffer);
		} else if (type == ObjectType.Opaque) {
			value = buffer.readString (ObjectType.Opaque, true);
		} else if (type == ObjectType.Counter64) {
			value = readUint64 (buffer);
		} else if (type == ObjectType.NoSuchObject) {
			buffer.readByte ();
			buffer.readByte ();
			value = null;
		} else if (type == ObjectType.NoSuchInstance) {
			buffer.readByte ();
			buffer.readByte ();
			value = null;
		} else if (type == ObjectType.EndOfMibView) {
			buffer.readByte ();
			buffer.readByte ();
			value = null;
		} else {
			throw new ResponseInvalidError ("Unknown type '" + type
					+ "' in response");
		}
		
		varbinds.push ({
			oid: oid,
			type: type,
			value: value
		});
	}
}

function writeUint (buffer, type, value) {
	var b = new Buffer (4);
	b.writeUInt32BE (value);
	buffer.writeBuffer (b, type);
}

function writeUint64 (buffer, value) {
	if (value.length > 8)
		throw new RequestInvalidError ("64 bit unsigned integer too long '"
				+ value.length + "'")
	buffer.writeBuffer (value, ObjectType.Counter64);
}

function writeVarbinds (buffer, varbinds) {
	buffer.startSequence ();
	for (var i = 0; i < varbinds.length; i++) {
		buffer.startSequence ();
		buffer.writeOID (varbinds[i].oid);
		
		if (varbinds[i].type && varbinds[i].value) {
			var type = varbinds[i].type;
			var value = varbinds[i].value;
		
			if (type == ObjectType.Boolean) {
				buffer.writeBoolean (value ? true : false);
			} else if (type == ObjectType.Integer) { // also Integer32
				buffer.writeInt (value);
			} else if (type == ObjectType.OctetString) {
				buffer.writeString (value);
			} else if (type == ObjectType.Null) {
				buffer.writeNull ();
			} else if (type == ObjectType.OID) {
				buffer.writeOID (value);
			} else if (type == ObjectType.IpAddress) {
				var bytes = value.split (".");
				if (bytes.length != 4)
					throw new RequestInvalidError ("Invalid IP address '"
							+ value + "'");
				buffer.writeBuffer (new Buffer (bytes), 64);
			} else if (type == ObjectType.Counter) { // also Counter32
				writeUint (buffer, ObjectType.Counter, value);
			} else if (type == ObjectType.Gauge) { // also Gauge32 & Unsigned32
				writeUint (buffer, ObjectType.Gauge, value);
			} else if (type == ObjectType.TimeTicks) {
				writeUint (buffer, ObjectType.TimeTicks, value);
			} else if (type == ObjectType.Opaque) {
				buffer.writeBuffer (value, ObjectType.Opaque);
			} else if (type == ObjectType.Counter64) {
				writeUint64 (buffer, value);
			} else {
				throw new RequestInvalidError ("Unknown type '" + type
						+ "' in request");
			}
		} else {
			buffer.writeNull ();
		}
		
		buffer.endSequence ();
	};
	buffer.endSequence ();
}

/*****************************************************************************
 ** PDU class definitions
 **/

var SimplePdu = function (id, varbinds, options) {
	this.id = id;
	this.varbinds = varbinds;
	this.options = options || {};
};

SimplePdu.prototype.toBuffer = function (buffer) {	
	buffer.startSequence (this.type);
	
	buffer.writeInt (this.id);
	buffer.writeInt ((this.type == PduType.GetBulkRequest)
			? (this.options.nonRepeaters || 0)
			: 0);
	buffer.writeInt ((this.type == PduType.GetBulkRequest)
			? (this.options.maxRepetitions || 0)
			: 0);
	
	writeVarbinds (buffer, this.varbinds);
	
	buffer.endSequence ();
};

var GetBulkRequestPdu = function () {
	this.type = PduType.GetBulkRequest;
	GetBulkRequestPdu.super_.apply (this, arguments);
};

util.inherits (GetBulkRequestPdu, SimplePdu);

var GetNextRequestPdu = function () {
	this.type = PduType.GetNextRequest;
	GetNextRequestPdu.super_.apply (this, arguments);
};

util.inherits (GetNextRequestPdu, SimplePdu);

var GetResponsePdu = function (buffer) {
	this.type = PduType.GetResponse;

	buffer.readSequence (this.type);
	
	this.id = buffer.readInt ();
	
	this.errorStatus = buffer.readInt ();
	this.errorIndex = buffer.readInt ();
	
	this.varbinds = [];
	
	readVarbinds (buffer, this.varbinds);
};

var GetRequestPdu = function () {
	this.type = PduType.GetRequest;
	GetRequestPdu.super_.apply (this, arguments);
};

util.inherits (GetRequestPdu, SimplePdu);

var InformRequestPdu = function () {
	this.type = PduType.InformRequest;
	InformRequestPdu.super_.apply (this, arguments);
};

util.inherits (InformRequestPdu, SimplePdu);

var SetRequestPdu = function () {
	this.type = PduType.SetRequest;
	SetRequestPdu.super_.apply (this, arguments);
};

util.inherits (SetRequestPdu, SimplePdu);

var TrapPdu = function (typeOrOid, varbinds, agentAddr) {
	this.type = PduType.Trap;
	
	this.agentAddr = agentAddr || "127.0.0.1";
	
	if (typeof typeOrOid == "string") {
		this.generic = TrapType.EnterpriseSpecific;
		this.specific = parseInt (typeOrOid.match (/\.(\d+)$/)[1]);
		this.enterprise = typeOrOid.replace (/\.(\d+)$/, "");
	} else {
		this.generic = typeOrOid;
		this.specific = 0;
		this.enterprise = "1.3.6.1.4.1";
	}
	
	this.varbinds = varbinds;
};

TrapPdu.prototype.toBuffer = function (buffer) {	
	buffer.startSequence (this.type);
	
	buffer.writeOID (this.enterprise);
	buffer.writeBuffer (new Buffer (this.agentAddr.split (".")),
			ObjectType.IpAddress);
	buffer.writeInt (this.generic);
	buffer.writeInt (this.specific);
	buffer.writeInt (process.uptime () * 100, ObjectType.TimeTicks);
	
	writeVarbinds (buffer, this.varbinds);
	
	buffer.endSequence ();
};

var TrapV2Pdu = function () {
	this.type = PduType.TrapV2;
	TrapV2Pdu.super_.apply (this, arguments);
};

util.inherits (TrapV2Pdu, SimplePdu);

/*****************************************************************************
 ** Message class definitions
 **/

var RequestMessage = function (version, community, pdu) {
	this.version = version;
	this.community = community;
	this.pdu = pdu;
};

RequestMessage.prototype.toBuffer = function () {
	if (this.buffer)
		return this.buffer;

	var writer = new ber.Writer ();
	
	writer.startSequence ();
	
	writer.writeInt (this.version);
	writer.writeString (this.community);
	
	this.pdu.toBuffer (writer);
	
	writer.endSequence ();
	
	this.buffer = writer.buffer;
	
	return this.buffer;
};

var ResponseMessage = function (buffer) {
	var reader = new ber.Reader (buffer);
	
	reader.readSequence ();
	
	this.version = reader.readInt ();
	this.community = reader.readString ();
	
	var type = reader.peek ();
	
	if (type == PduType.GetResponse) {
		this.pdu = new GetResponsePdu (reader);
	} else {
		throw new ResponseInvalidError ("Unknown PDU type '" + type
				+ "' in response");
	}
}

/*****************************************************************************
 ** Session class definition
 **/

var Session = function (target, community, options) {
	this.target = target || "127.0.0.1";
	this.community = community || "public";
	
	this.version = (options && options.version) ? options.version : Version1;
	
	this.port = (options && options.port ) ? options.port : 161;
	this.trapPort = (options && options.trapPort ) ? options.trapPort : 162;
	
	this.retries = (options && options.retries) ? options.retries : 1;
	this.timeout = (options && options.timeout) ? options.timeout : 5000;
	
	this.reqs   = {};
};

function _generateId () {
	return Math.floor (Math.random () + Math.random () * 10000000)
}

Session.prototype.get = function (oids, responseCb) {
	function feedCb (req, message) {
		var pdu = message.pdu;
		var varbinds = [];
		
		if (req.message.pdu.varbinds.length != pdu.varbinds.length) {
			req.responseCb (new ResponseInvalidError ("Requested OIDs do not "
					+ "match response OIDs"));
		} else {
			for (var i = 0; i < req.message.pdu.varbinds.length; i++) {
				if (req.message.pdu.varbinds[i].oid != pdu.varbinds[i].oid) {
					req.responseCb (new ResponseInvalidError ("OID '"
							+ req.message.pdu.varbinds[i].oid
							+ "' in request at positiion '" + i + "' does not "
							+ "match OID '" + pdu.varbinds[i].oid + "' in response "
							+ "at position '" + i + "'"));
					return;
				} else {
					varbinds.push (pdu.varbinds[i]);
				}
			}
			
			req.responseCb (null, varbinds);
		}
	};

	var pduVarbinds = [];
	
	for (var i = 0; i < oids.length; i++) {
		var varbind = {
			oid: oids[i]
		};
		pduVarbinds.push (varbind);
	}

	this.simpleGet (GetRequestPdu, feedCb, pduVarbinds, responseCb);
	
	return this;
};

Session.prototype.getBulk = function () {
	var oids, nonRepeaters, maxRepetitions, responseCb;

	if (arguments.length >= 4) {
		oids = arguments[0];
		nonRepeaters = arguments[1];
		maxRepetitions = arguments[2];
		responseCb = arguments[3];
	} else if (arguments.length >= 3) {
		oids = arguments[0];
		nonRepeaters = arguments[1];
		maxRepetitions = 10;
		responseCb = arguments[2];
	} else {
		oids = arguments[0];
		nonRepeaters = 0;
		maxRepetitions = 10;
		responseCb = arguments[1];
	}

	function feedCb (req, message) {
		var pdu = message.pdu;
		var varbinds = [];
		var i = 0;
		
		// first walk through and grab non-repeaters
		if (pdu.varbinds.length < nonRepeaters) {
			req.responseCb (new ResponseInvalidError ("Varbind count in "
					+ "response '" + pdu.varbinds.length + "' is less than "
					+ "non-repeaters '" + nonRepeaters + "' in request"));
		} else {
			for ( ; i < nonRepeaters; i++) {
				if (isVarbindError (pdu.varbinds[i])) {
					varbinds.push (pdu.varbinds[i]);
				} else if (! oidFollowsOid (req.message.pdu.varbinds[i].oid,
						pdu.varbinds[i].oid)) {
					req.responseCb (new ResponseInvalidError ("OID '"
							+ req.message.pdu.varbinds[i].oid + "' in request at "
							+ "positiion '" + i + "' does not precede "
							+ "OID '" + pdu.varbinds[i].oid + "' in response "
							+ "at position '" + i + "'"));
					return;
				} else {
					varbinds.push (pdu.varbinds[i]);
				}
			}
		}
		
		var repeaters = req.message.pdu.varbinds.length - nonRepeaters;
		
		// secondly walk through and grab repeaters
		if (pdu.varbinds.length % (repeaters)) {
			req.responseCb (new ResponseInvalidError ("Varbind count in "
					+ "response '" + pdu.varbinds.length + "' is not a "
					+ "multiple of repeaters '" + repeaters
					+ "' plus non-repeaters '" + nonRepeaters + "' in request"));
		} else {
			while (i < pdu.varbinds.length) {
				for (var j = 0; j < repeaters; j++, i++) {
					var reqIndex = nonRepeaters + j;
					var respIndex = i;

					if (isVarbindError (pdu.varbinds[respIndex])) {
						if (! varbinds[reqIndex])
							varbinds[reqIndex] = [];
						varbinds[reqIndex].push (pdu.varbinds[respIndex]);
					} else if (! oidFollowsOid (
							req.message.pdu.varbinds[reqIndex].oid,
							pdu.varbinds[respIndex].oid)) {
						req.responseCb (new ResponseInvalidError ("OID '"
								+ req.message.pdu.varbinds[reqIndex].oid
								+ "' in request at positiion '" + (reqIndex)
								+ "' does not precede OID '"
								+ pdu.varbinds[respIndex].oid
								+ "' in response at position '" + (respIndex) + "'"));
						return;
					} else {
						if (! varbinds[reqIndex])
							varbinds[reqIndex] = [];
						varbinds[reqIndex].push (pdu.varbinds[respIndex]);
					}
				}
			}
		}
		
		req.responseCb (null, varbinds);
	};
	
	var pduVarbinds = [];
	
	for (var i = 0; i < oids.length; i++) {
		var varbind = {
			oid: oids[i]
		};
		pduVarbinds.push (varbind);
	}
	
	var options = {
		nonRepeaters: nonRepeaters,
		maxRepetitions: maxRepetitions
	};

	this.simpleGet (GetBulkRequestPdu, feedCb, pduVarbinds, responseCb,
			options);
	
	return this;
};

Session.prototype.getNext = function (oids, responseCb) {
	function feedCb (req, message) {
		var pdu = message.pdu;
		var varbinds = [];
		
		if (req.message.pdu.varbinds.length != pdu.varbinds.length) {
			req.responseCb (new ResponseInvalidError ("Requested OIDs do not "
					+ "match response OIDs"));
		} else {
			for (var i = 0; i < req.message.pdu.varbinds.length; i++) {
				if (isVarbindError (pdu.varbinds[i])) {
					varbinds.push (pdu.varbinds[i]);
				} else if (! oidFollowsOid (req.message.pdu.varbinds[i].oid,
						pdu.varbinds[i].oid)) {
					req.responseCb (new ResponseInvalidError ("OID '"
							+ req.message.pdu.varbinds[i].oid + "' in request at "
							+ "positiion '" + i + "' does not precede "
							+ "OID '" + pdu.varbinds[i].oid + "' in response "
							+ "at position '" + i + "'"));
					return;
				} else {
					varbinds.push (pdu.varbinds[i]);
				}
			}
			
			req.responseCb (null, varbinds);
		}
	};
	
	var pduVarbinds = [];
	
	for (var i = 0; i < oids.length; i++) {
		var varbind = {
			oid: oids[i]
		};
		pduVarbinds.push (varbind);
	}

	this.simpleGet (GetNextRequestPdu, feedCb, pduVarbinds, responseCb);
	
	return this;
};

Session.prototype.inform = function () {
	var typeOrOid = arguments[0];;
	var varbinds, responseCb;

	if (arguments.length >= 3) {
		varbinds = arguments[1];
		responseCb = arguments[2];
	} else {
		varbinds = [];
		responseCb = arguments[1];
	}

	function feedCb (req, message) {
		var pdu = message.pdu;
		var varbinds = [];
		
		if (req.message.pdu.varbinds.length != pdu.varbinds.length) {
			req.responseCb (new ResponseInvalidError ("Inform OIDs do not "
					+ "match response OIDs"));
		} else {
			for (var i = 0; i < req.message.pdu.varbinds.length; i++) {
				if (req.message.pdu.varbinds[i].oid != pdu.varbinds[i].oid) {
					req.responseCb (new ResponseInvalidError ("OID '"
							+ req.message.pdu.varbinds[i].oid
							+ "' in inform at positiion '" + i + "' does not "
							+ "match OID '" + pdu.varbinds[i].oid + "' in response "
							+ "at position '" + i + "'"));
					return;
				} else {
					varbinds.push (pdu.varbinds[i]);
				}
			}
			
			req.responseCb (null, varbinds);
		}
	};
	
	if (typeof typeOrOid != "string")
		typeOrOid = "1.3.6.1.6.3.1.1.5." + (typeOrOid + 1);

	var pduVarbinds = [
		{
			oid: "1.3.6.1.2.1.1.3.0",
			type: ObjectType.TimeTicks,
			value: process.uptime () * 100
		},
		{
			oid: "1.3.6.1.6.3.1.1.4.1.0",
			type: ObjectType.OID,
			value: typeOrOid
		}
	];
	
	for (var i = 0; i < varbinds.length; i++) {
		var varbind = {
			oid: varbinds[i].oid,
			type: varbinds[i].type,
			value: varbinds[i].value
		};
		pduVarbinds.push (varbind);
	}
	
	var options = {
		port: this.trapPort
	};

	this.simpleGet (InformRequestPdu, feedCb, pduVarbinds, responseCb, options);
	
	return this;
};

Session.prototype.onMsg = function (req, buffer, remote) {
	try {
		clearTimeout (req.timer);
		delete req.timer;

		var message = new ResponseMessage (buffer);
		
		function cbError (req, error) {
			if (req.dgram && req.dgram.fd)
				req.dgram.close ();
			req.responseCb (error);
		};
		
		if (message.pdu.id != req.message.pdu.id) {
			cbError (req, new ResponseInvalidError ("ID in request '"
					+ req.message.pdu.id + "' does not match ID in "
					+ "response '" + message.pdu.id));
		} else if (message.version != req.message.version) {
			cbError (req, new ResponseInvalidError ("Version in request '"
					+ req.message.version + "' does not match version in "
					+ "response '" + message.version));
		} else if (message.community != req.message.community) {
			cbError (req, new ResponseInvalidError ("Community '"
					+ req.message.community + "' in request does not match "
					+ "community '" + message.community + "' in response"));
		} else if (message.pdu.type == PduType.GetResponse) {
			req.onResponse (req, message);
		} else {
			cbError (req, new ResponseInvalidError ("Unknown PDU type '"
					+ message.pdu.type + "' in response"));
		}
	} catch (error) {
		cbError (req, error);
	}
};

Session.prototype.onSimpleGetResponse = function (req, message) {
	req.dgram.close ();
	
	var pdu = message.pdu;
	
	if (pdu.errorStatus > 0) {
		var statusString = ErrorStatus[pdu.errorStatus]
				|| ErrorStatus.GeneralError;
		var statusCode = ErrorStatus[statusString]
				|| ErrorStatus[ErrorStatus.GeneralError];
		
		if (pdu.errorIndex <= 0 || pdu.errorIndex > pdu.varbinds.length) {
			req.responseCb (new RequestFailedError (statusString, statusCode));
		} else {
			var oid = pdu.varbinds[pdu.errorIndex - 1].oid;
			var error = new RequestFailedError (statusString + ": " + oid,
					statusCode);
			req.responseCb (error);
		}
	} else {
		req.feedCb (req, message);
	}
};

Session.prototype.send = function (req, noWait) {
	var session = this;
	
	var buffer = req.message.toBuffer ();
	
	req.dgram.send (buffer, 0, buffer.length, req.port, this.target,
			function (error, bytes) {
		if (error) {
			req.responseCb (new Error (error));
		} else {
			if (noWait) {
				req.dgram.close ();
				req.responseCb (null);
			} else {
				req.timer = setTimeout (function () {
					if (req.retries-- > 0) {
						session.send (req);
					} else {
						req.dgram.close ();
						req.responseCb (new RequestTimedOutError (
								"Request timed out"));
					}
				}, req.timeout);
			}
		}
	});
	
	return this;
};

Session.prototype.set = function (varbinds, responseCb) {
	function feedCb (req, message) {
		var pdu = message.pdu;
		var varbinds = [];
		
		if (req.message.pdu.varbinds.length != pdu.varbinds.length) {
			req.responseCb (new ResponseInvalidError ("Requested OIDs do not "
					+ "match response OIDs"));
		} else {
			for (var i = 0; i < req.message.pdu.varbinds.length; i++) {
				if (req.message.pdu.varbinds[i].oid != pdu.varbinds[i].oid) {
					req.responseCb (new ResponseInvalidError ("OID '"
							+ req.message.pdu.varbinds[i].oid
							+ "' in request at positiion '" + i + "' does not "
							+ "match OID '" + pdu.varbinds[i].oid + "' in response "
							+ "at position '" + i + "'"));
					return;
				} else {
					varbinds.push (pdu.varbinds[i]);
				}
			}
			
			req.responseCb (null, varbinds);
		}
	};

	var pduVarbinds = [];
	
	for (var i = 0; i < varbinds.length; i++) {
		var varbind = {
			oid: varbinds[i].oid,
			type: varbinds[i].type,
			value: varbinds[i].value
		};
		pduVarbinds.push (varbind);
	}

	this.simpleGet (SetRequestPdu, feedCb, pduVarbinds, responseCb);
	
	return this;
};

Session.prototype.simpleGet = function (pduClass, feedCb, varbinds,
		responseCb, options) {
	var req = {}
		
	try {
		var pdu = new pduClass (_generateId (), varbinds, options);	
		var message = new RequestMessage (this.version, this.community, pdu);

		req = {
			message: message,
			responseCb: responseCb,
			retries: this.retries,
			timeout: this.timeout,
			onResponse: this.onSimpleGetResponse,
			feedCb: feedCb,
			port: (options && options.port) ? options.port : this.port
		};

		var me = this;
		req.dgram = dgram.createSocket ("udp4");
		req.dgram.on ("message", me.onMsg.bind (me, req));

		this.send (req);
	} catch (error) {
		if (req.dgram && req.dgram.fd)
			req.dgram.close ();
		if (req.responseCb)
			req.responseCb (error);
	}
};

Session.prototype.trap = function () {
	var req = {};
	
	try {
		var typeOrOid = arguments[0];
		var varbinds, agentAddr, responseCb;
	
		if (arguments.length >= 4) {
			varbinds = arguments[1];
			agentAddr = arguments[2];
			responseCb = arguments[3];
		} else if (arguments.length >= 3) {
			if (typeof arguments[1] == "string") {
				varbinds = [];
				agentAddr = arguments[1];
			} else {
				varbinds = arguments[1];
				agentAddr = null;
			}
			responseCb = arguments[2];
		} else {
			varbinds = [];
			agentAddr = null;
			responseCb = arguments[1];
		}

		var pdu, pduVarbinds = [];

		for (var i = 0; i < varbinds.length; i++) {
			var varbind = {
				oid: varbinds[i].oid,
				type: varbinds[i].type,
				value: varbinds[i].value
			};
			pduVarbinds.push (varbind);
		}

		if (this.version == Version2c) {
			if (typeof typeOrOid != "string")
				typeOrOid = "1.3.6.1.6.3.1.1.5." + (typeOrOid + 1);

			pduVarbinds.unshift (
				{
					oid: "1.3.6.1.2.1.1.3.0",
					type: ObjectType.TimeTicks,
					value: process.uptime () * 100
				},
				{
					oid: "1.3.6.1.6.3.1.1.4.1.0",
					type: ObjectType.OID,
					value: typeOrOid
				}
			);

			pdu = new TrapV2Pdu (_generateId (), pduVarbinds);
		} else {
			pdu = new TrapPdu (typeOrOid, pduVarbinds, agentAddr);
		}

		var message = new RequestMessage (this.version, this.community, pdu);

		req = {
			message: message,
			responseCb: responseCb,
			port: this.trapPort
		};

		req.dgram = dgram.createSocket ("udp4");

		this.send (req, true);
	} catch (error) {
		if (req.dgram && req.dgram.fd)
			req.dgram.close ();
		if (req.responseCb)
			req.responseCb (error);
	}
	
	return this;
};

/*****************************************************************************
 ** Exports
 **/

exports.Session = Session;

exports.createSession = function (target, community, version, options) {
	return new Session (target, community, version, options);
};

exports.isVarbindError = isVarbindError;
exports.varbindError = varbindError;

exports.Version1 = Version1;
exports.Version2c = Version2c;

exports.ErrorStatus = ErrorStatus;
exports.TrapType = TrapType;
exports.ObjectType = ObjectType;

exports.ResponseInvalidError = ResponseInvalidError;
exports.RequestInvalidError = RequestInvalidError;
exports.RequestFailedError = RequestFailedError;
exports.RequestTimedOutError = RequestTimedOutError;
