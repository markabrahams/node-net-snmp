var snmp = require ("../");
var getopts = require ("getopts");

var options = getopts(process.argv.slice(2));

var snmpOptions = {
    disableAuthorization: options.n,
    port: options.p,
    engineID: options.e,
    debug: options.d
};

var callback = function (error, data) {
    if ( error ) {
        console.error (error);
    } else {
        console.log (JSON.stringify(data.pdu.varbinds, null, 2));
    }
};

var agent = snmp.createAgent(snmpOptions, callback);
var authorizer = agent.getAuthorizer ();
authorizer.addCommunity ("public");
authorizer.addUser ({
    name: "fred",
    level: snmp.SecurityLevel.noAuthNoPriv
});
authorizer.addUser ({
    name: "betty",
    level: snmp.SecurityLevel.authNoPriv,
    authProtocol: snmp.AuthProtocols.sha,
    authKey: "illhavesomeauth"
});
authorizer.addUser ({
    name: "wilma",
    level: snmp.SecurityLevel.authPriv,
    authProtocol: snmp.AuthProtocols.sha,
    authKey: "illhavesomeauth",
    privProtocol: snmp.PrivProtocols.des,
    privKey: "andsomepriv"
});

var forwarder = agent.getForwarder ();
forwarder.addProxy({
    context: "freds",
    transport: "udp4",
    target: "localhost",
    port: 2161,
    user: {
        name: "fred",
        level: snmp.SecurityLevel.noAuthNoPriv
    }
});
forwarder.addProxy({
    context: "bettys",
    transport: "udp4",
    target: "localhost",
    port: 2161,
    user: {
        name: "betty",
        level: snmp.SecurityLevel.authNoPriv,
        authProtocol: snmp.AuthProtocols.sha,
        authKey: "illhavesomeauth"
    }
});
forwarder.addProxy({
    context: "wilmas",
    transport: "udp4",
    target: "localhost",
    port: 2161,
    user: {
        name: "wilma",
        level: snmp.SecurityLevel.authPriv,
        authProtocol: snmp.AuthProtocols.sha,
        authKey: "illhavesomeauth",
        privProtocol: snmp.PrivProtocols.des,
        privKey: "andsomepriv"
    },
});

forwarder.dumpProxies ();
