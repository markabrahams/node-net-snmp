var snmp = require ("../");
var getopts = require ("getopts");

var options = getopts(process.argv.slice(2));

var snmpOptions = {
    disableAuthorization: options.n,
    port: options.p,
    engineID: options.e
};

var agent = snmp.createAgent(snmpOptions);
agent.getAuthorizer().addCommunity ("public");
agent.getAuthorizer().addUser ({
    name: "fred",
    level: snmp.SecurityLevel.noAuthNoPriv
});
agent.getAuthorizer().addUser ({
    name: "betty",
    level: snmp.SecurityLevel.authNoPriv,
    authProtocol: snmp.AuthProtocols.sha,
    authKey: "illhavesomeauth"
});
agent.getAuthorizer().addUser ({
    name: "wilma",
    level: snmp.SecurityLevel.authPriv,
    authProtocol: snmp.AuthProtocols.sha,
    authKey: "illhavesomeauth",
    privProtocol: snmp.PrivProtocols.des,
    privKey: "andsomepriv"
});
// console.log(JSON.stringify(agent.getAuthorizer().getUsers(), null, 2));

var provider = {
    oid: "1.3.6.1.2.2.1.2",
    handler: null
};
agent.addProvider (provider);
provider = {
    oid: "1.3.6.1.13.22.33.44",
    handler: null
};
agent.addProvider (provider);

agent.mib.dump ();
