
// Copyright 2013 Stephen Vickers

var snmp = require ("../");
//var options = require("./option-parser");

var cb = function(error, trap) {
    if (error) {
        console.error(error);
    } else {
        if (trap.enterprise) {
            console.log("Trap (v1): " + trap.enterprise);
        } else {
            console.log("Trap (v2): " + trap.varbinds[1].value)
        }
    }
}

var receiver = snmp.createReceiver({disableAuthorization: true}, cb);
receiver.addUser ({
    engineID: this.engineID,
    name: "none",
    level: snmp.SecurityLevel.noAuthNoPriv
});
receiver.addUser ({
    name: "md5only",
    level: snmp.SecurityLevel.authNoPriv,
    authProtocol: snmp.AuthProtocols.md5,
    authKey: "presnets8"
});
receiver.addUser ({
    name: "md5des",
    level: snmp.SecurityLevel.authPriv,
    authProtocol: snmp.AuthProtocols.md5,
    authKey: "presnets8",
    privProtocol: snmp.PrivProtocols.des,
    privKey: "presnets8"
});
receiver.addUser ({
    name: "shades",
    level: snmp.SecurityLevel.authPriv,
    authProtocol: snmp.AuthProtocols.sha,
    authKey: "presnets8",
    privProtocol: snmp.PrivProtocols.des,
    privKey: "presnets8"
});
receiver.addCommunity("public");
