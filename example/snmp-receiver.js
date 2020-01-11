
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

var receiver = snmp.createReceiver({}, cb);

