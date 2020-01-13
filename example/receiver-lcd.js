
// Copyright 2013 Stephen Vickers

var snmp = require ("../");

var cb = function(error, trap) {
    console.log ("Ignoring notifications");
}

var receiver = snmp.createReceiver({}, cb);

console.log ("\nCommunity tests");
console.log ("===============\n");
console.log ("Initial communities:");
console.log ("communities =", receiver.getCommunities () );
receiver.addCommunity ("public");
receiver.addCommunity ("private");
console.log ("After adding 'public' and 'private' communities:");
console.log ("communities =", receiver.getCommunities () );
console.log ("Fetch existing 'public' community:");
console.log (receiver.getCommunity("public"));
console.log ("Fetch non-existent community 'notfound':");
console.log (receiver.getCommunity("notfound"));
console.log ("Delete non-existent community 'notfound':")
receiver.deleteCommunity("notfound");
console.log ("communities =", receiver.getCommunities () );
console.log ("Delete existing community 'private':")
receiver.deleteCommunity("private");
console.log ("communities =", receiver.getCommunities () );

var fred = {
    name: "fred",
    level: snmp.SecurityLevel.noAuthNoPriv
};
var wilma = {
    name: "wilma",
    level: snmp.SecurityLevel.authPriv,
    authProtocol: snmp.AuthProtocols.sha,
    authKey: "illhavesomeauth",
    privProtocol: snmp.PrivProtocols.des,
    privKey: "andsomepriv"
};
var newWilma = {
    name: "wilma",
    level: snmp.SecurityLevel.authNoPriv,
    authProtocol: snmp.AuthProtocols.sha,
    authKey: "illhavesomeauth"
};
console.log ("\nUser tests");
console.log ("==========\n");
console.log ("Initial users:");
console.log ("users =", receiver.getUsers () );
receiver.addUser (fred);
receiver.addUser (wilma);
console.log ("After adding 'fred' and 'wilma' users:");
console.log ("users =", receiver.getUsers () );
console.log ("Fetch existing user 'fred':");
console.log (receiver.getUser("fred"));
console.log ("Fetch non-existent user 'barney':");
console.log (receiver.getUser("barney"));
console.log ("Add existing user 'wilma' (should replace existing 'wilma'):");
receiver.addUser (newWilma);
console.log ("users =", receiver.getUsers () );
console.log ("Delete non-existent user 'barney':")
receiver.deleteUser("barney");
console.log ("users =", receiver.getUsers () );
console.log ("Delete existing user 'wilma':")
receiver.deleteUser("wilma");
console.log ("users =", receiver.getUsers () );

receiver.close();
