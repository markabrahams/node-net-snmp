
// Copyright 2013 Stephen Vickers

var snmp = require ("../");

var cb = function(error, trap) {
    if ( error ) {
        console.error (error);
    } else {
        console.log (JSON.stringify(trap, null, 2));
    }
};

var options = {
    disableAuthorization: true,
    accessControlModelType: snmp.AccessControlModelType.Simple,
    port: 1162
};
var receiver = snmp.createReceiver (options, cb);
var authorizer = receiver.getAuthorizer ();

console.log ("\nCommunity tests");
console.log ("===============\n");
console.log ("Initial communities:");
console.log ("communities =", authorizer.getCommunities () );
authorizer.addCommunity ("public");
authorizer.addCommunity ("private");
console.log ("After adding 'public' and 'private' communities:");
console.log ("communities =", authorizer.getCommunities () );
console.log ("Fetch existing 'public' community:");
console.log (authorizer.getCommunity("public"));
console.log ("Fetch non-existent community 'notfound':");
console.log (authorizer.getCommunity("notfound"));
console.log ("Delete non-existent community 'notfound':");
authorizer.deleteCommunity("notfound");
console.log ("communities =", authorizer.getCommunities () );
console.log ("Delete existing community 'private':");
authorizer.deleteCommunity("private");
console.log ("communities =", authorizer.getCommunities () );

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
console.log ("users =", authorizer.getUsers () );
authorizer.addUser (fred);
authorizer.addUser (wilma);
console.log ("After adding 'fred' and 'wilma' users:");
console.log ("users =", authorizer.getUsers () );
console.log ("Fetch existing user 'fred':");
console.log (authorizer.getUser("fred"));
console.log ("Fetch non-existent user 'barney':");
console.log (authorizer.getUser("barney"));
console.log ("Add existing user 'wilma' (should replace existing 'wilma'):");
authorizer.addUser (newWilma);
console.log ("users =", authorizer.getUsers () );
console.log ("Delete non-existent user 'barney':");
authorizer.deleteUser("barney");
console.log ("users =", authorizer.getUsers () );
console.log ("Delete existing user 'wilma':");
authorizer.deleteUser("wilma");
console.log ("users =", authorizer.getUsers () );

console.log ("\nAccess control");
console.log ("==============\n");
var acm = authorizer.getAccessControlModel ();
acm.setCommunityAccess ("public", snmp.AccessLevel.ReadOnly);
acm.setCommunityAccess ("private", snmp.AccessLevel.ReadWrite);
console.log ("private = ", acm.getCommunityAccess ("private"));
console.log (acm.getCommunitiesAccess ());

acm.setUserAccess ("fred", snmp.AccessLevel.ReadOnly);
acm.setUserAccess ("barney", snmp.AccessLevel.ReadWrite);
acm.removeUserAccess ("fred");
console.log ("barney = ", acm.getUserAccess ("barney"));
console.log (acm.getUsersAccess ());

//receiver.close();
