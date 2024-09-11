net-snmp
========

本模块实现了[简单网络管理协议(SNMP)](http://en.wikipedia.org/wiki/Simple_Network_Management_Protocol "SNMP")的1、2c和3版本。

*其他语言版本: [English](README.md), [简体中文](README.cn.md).*

该模块使用[node package manager (npm)](https://npmjs.org/ "npm")安装。

```
npm install net-snmp 
```

使用`require()`函数加载。

```
var snmp = require ("net-snmp"); 
```

然后可以创建到远程主机的会话，并用于执行SNMP请求和发送SNMP陷阱或通知。

```
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
```

应用
===================================================================

RFC 3413描述了五种类型的SNMP应用。

1.  命令生成器应用程序--发起读写请求
2.  命令应答器应用程序--对收到的读或写请求作出反应。
3.  通知发起者应用程序 -- -- 产生通知（陷阱或通知）。
4.  接收通知的应用程序 -- -- 接收通知（陷阱或通知）。
5.  代理转发应用--转发SNMP信息。


使用该模块 - 命令和通知生成器
===============================================================================================================================================

该库提供了一个`Session`类，为建立 "命令生成器 "和 "通知发起者 "SNMP应用程序提供支持。

所有的SNMP请求都是使用`Session`类的实例进行的。本模块输出两个函数，用于创建`Session`类的实例。

*   `createSession()` - for v1 and v2c sessions
*   `createV3Session()` - for v3 sessions

snmp.createSession ([target], [community], [options])
------------------------------------------------------------------------------------------------------------------------------------------------

`createSession()`函数实例化并返回一个SNMPv1或SNMPv2c的`Session`类实例。

```
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
    idBitsSize: 32
};

var session = snmp.createSession ("127.0.0.1", "public", options); 
```

可选的`target`参数默认为`127.0.0.1`。可选的 "community "参数默认为 "public"。可选的`options`参数是一个对象，可以包含以下项目。

* `port` - 发送请求的UDP端口，默认为`161`。
* "reties" -- -- 重新发送请求的次数，默认为 "1"。
* `sourceAddress`----SNMP请求应来自的IP地址，该选项没有默认值，操作系统将在发送SNMP请求时选择一个适当的源地址。
* `sourcePort` - UDP端口，SNMP请求应从该端口发出，默认为操作系统选择的短暂端口。
* `timeout` -- -- 在重新尝试或失败之前等待响应的毫秒数，默认值为`5000`。
* "backoff" -- -- 每次重试时增加 "超时 "的系数，不增加时默认为 "1"。
* `transport` -- -- 指定要使用的传输，可以是`udp4`或`udp6`，默认为`udp4`。
* `trapPort` -- -- 发送陷阱和通知的UDP端口，默认值为`162`。
* `version` - `snmp.Version1`或`snmp.Version2c`，默认为`snmp.Version1`。
* "backwardsGetNexts"----允许进行GetNext操作的布尔值，以检索词法上在前的OIDs。
* `idBitsSize` - `16`或`32`，默认为`32`。用来减少生成的id的大小，以便与一些旧设备兼容。

当一个会话结束后，应该关闭它。

```
session.close (); 
```

snmp.createV3Session (target, user, [options])
----------------------------------------------------------------------------------------------------------------------------------

`createV3Session()`函数实例化并返回一个与`createSession()`相同的`Session`类实例，只是为SNMPv3进行了初始化。

```
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
```

`target`和`user`参数是强制性的。可选的 "options "参数与 "createSession() "调用的含义相同。选项参数中一个额外的字段是`context`字段，它为会话添加一个SNMPv3上下文。

`user`对象必须包含`name`和`level`字段。`level`字段可以从`snmp.SecurityLevel`对象中取值。

* `snmp.SecurityLevel.noAuthNoPriv` - 不进行消息认证或加密。
* `snmp.SecurityLevel.authNoPriv` -- -- 用于信息认证，不进行加密。
* `snmp.SecurityLevel.authPriv` -- -- 用于信息认证和加密。

这些字段的含义符合RFC3414的规定。如果提供的 "level "是 "authNoPriv "或 "authPriv"，那么 "authProtocol "和 "authKey "字段也必须存在。`authProtocol`字段可以从`snmp.AuthProtocols`对象中取值。

* `snmp.AuthProtocols.md5` - 用于MD5消息认证。
* `snmp.AuthProtocols.sha` -- -- 用于SHA信息认证。

如果提供的 "level "是 "authPriv"，那么 "privProtocol "和 "privKey "字段也必须存在。`privProtocol`字段可以从`snmp.PrivProtocols`对象中取值。

* `snmp.PrivProtocols.des` - 用于DES加密。
* `snmp.PrivProtocols.aes` -- -- 用于AES加密。

一旦创建了v3会话，就可以使用与v1和v2c相同的一组 "会话 "方法。

session.on ("close", callback)
-------------------------------------------------------------------------------------------------

当会话的底层UDP套接字被关闭时，会话会发出 "close "事件。

没有参数传递给回调。

在该事件发出之前，所有未完成的请求都会被取消，导致每个未完成的请求失败。传回给每个请求的错误将是一个`Error`类的实例，其错误`message`属性设置为`Socket forcibly closed`。

下面的例子是当一个会话的底层UDP套接字被关闭时，打印一条消息到控制台。

```
session.on ("close", function () {
    console.log ("socket closed");
}); 
```

session.on ("error", callback)
-------------------------------------------------------------------------------------------------

当会话的底层UDP套接字发出错误时，会话会发出 "error "事件。

以下参数将被传递给 "回调 "函数。

* `error` - `Error`类的一个实例，暴露的`message`属性将包含一个详细的错误信息。

下面的例子是当一个会话的底层UDP套接字发生错误时，打印一条消息到控制台，然后关闭该会话。

```
session.on ("error", function (error) {
    console.log (error.toString ());
    session.close ();
}); 
```

session.close ()
------------------------------------------------------------------------

`close()`方法关闭UDP套接字的底层会话。这将导致会话底层UDP套接字发出 "close "事件，并传递给会话，导致会话也发出 "close "事件。

下面的例子关闭了一个UDP套接字底层会话。

```
session.close (); 
```

session.get (oids, callback)
-----------------------------------------------------------------------------------------------

`get()`方法获取一个或多个OID的值。

`oids`参数是一个OID字符串数组。一旦请求完成，`callback`函数就会被调用。以下参数将被传递给`callback`函数。

* `error` - `Error`类或子类的实例，如果没有发生错误，则为`null`。
* `varbinds` - varbinds数组，如果发生错误将不提供。

`varbinds`数组中位置N的varbind将对应于请求中`oids`数组中位置N的OID。

当使用SNMP版本2c时，必须使用`snmp.isVarbindError()`函数检查每个varbind是否存在错误条件。

以下示例获取sysName(`1.3.6.1.2.1.1.5.0`)和sysLocation(`1.3.6.1.2.1.1.6.0`)OIDs的值。

```
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

session.getBulk (oids, [nonRepeaters], [maxRepetitions], callback)
-------------------------------------------------------------------------------------------------------------------------------------------------------------------------

`getBulk()`方法获取MIB树中一个或多个OID后按词法排列的OID的值。

`oids`参数是一个OID字符串的数组。可选的`nonRepeaters`参数指定`oids`参数中只应返回1个varbind的OID的数量，默认为`0`。对于`oids`参数中剩余的每一个OID，可选的`maxRepetitions`参数指定了一个OID后面的词法OID的数量，对于这些OID，varbind应该被获取，默认值为`20`。

一旦请求完成，`callback`函数就会被调用。以下参数将被传递给`callback`函数。

* `error` - `Error`类或子类的实例，如果没有发生错误，则为`null`。
* `varbinds` - varbinds数组，如果发生错误将不提供。

`varbinds`数组中N位置的varbind将与请求中`oids`数组中N位置的OID相对应。

对于`varbinds`中的第一个`nonRepeaters`项目，每个项目将是一个单一的varbind。对于`varbinds`中所有剩余的项目，每个项目将是一个varbinds数组--这使得将响应的varbinds与请求的OID绑定起来很容易，因为响应的varbinds被分组并放在`varbinds`中的相同位置。

当使用SNMP版本2c时，必须使用`snmp.isVarbindError()`函数检查每个varbind是否存在错误条件。

下面的例子获取sysContact（`1.3.6.1.2.1.4.0`）和sysName（`1.3.6.1.2.1.5. 0`)OID，以及ifTable(`1.3.6.1.2.1.2.1.2`)表中ifDescr(`1.3.6.1.2.1.2.1.2`)和ifType(`1.3.6.1.2.1.2.1.3`)列中最多前20个OID。

```
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

session.getNext (oids, callback)
-------------------------------------------------------------------------------------------------------

`getNext()`方法获取MIB树中一个或多个OID后按词法排列的OID的值。

`oids`参数是一个OID字符串的数组。一旦请求完成，就会调用`callback`函数。以下参数将被传递给`callback`函数。

* `error` - `Error`类或子类的实例，如果没有发生错误，则为`null`。
* `varbinds` - varbinds数组，如果发生错误将不提供。

`varbinds`数组中位置N的varbind将对应于请求中`oids`数组中位置N的OID。

当使用SNMP版本2c时，必须使用`snmp.isVarbindError()`函数检查每个varbind是否存在错误条件。

下面的例子获取sysObjectID(`1.3.6.1.1.2.1.1.0`)和sysName(`1.3.6.1.1.2.1.4.0`)OID之后的下一个OID的值。

```
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

session.inform (typeOrOid, [varbinds], [options], callback)
-----------------------------------------------------------------------------------------------------------------------------------------------------------

`inform()`方法发送一个SNMP信息。

`typeOrOid`参数可以是两种类型之一：`snmp.TrapType`对象中定义的常量之一（不包括`snmp.TrapType.EnterpriseSpecific`常量），或者是一个OID字符串。

在请求消息中放置的第一个varbind将是`sysUptime.0` OID(`1.3.6.1.2.1.1.3.0`)。这个varbind的值将是`process.uptime()`函数返回的值乘以100(这可以通过在可选的`options`参数中提供`upTime`来覆盖，如下文所述)。

这之后会有第二个varbind的`snmpTrapOID.0` OID (`1.3.6.1.6.3.1.1.4.1.0`)。这个值取决于`typeOrOid`参数。如果指定了一个常量，那么常量的陷阱OID将被用来作为varbinds的值，否则指定的OID字符串将被用来作为varbind的值。

可选的 "varbinds "参数是要包含在信息请求中的varbinds数组，默认为空数组`[]`。

可选的`options`参数是一个对象，可以包含以下项目。

* `upTime` - inform中`sysUptime.0` OID(`1.3.6.1.2.1.1.3.0`)的值，默认为`process.uptime()`函数返回的值乘以100。

一旦收到对信息请求的答复或发生错误，就会调用 "回调 "函数。以下参数将被传递给`callback`函数。

* `error` - `Error`类或子类的实例，如果没有发生错误，则为`null`。
* `varbinds` - varbinds数组，如果发生错误将不提供。

`varbinds`数组中N位置的varbind将与请求中`varbinds`数组中N位置的varbind相对应。远程主机应该按照请求中的指定回传varbinds和它们的值，`varbinds`数组将包含远程主机发回的每个varbind。

通常没有理由使用`varbinds`参数的内容，因为varbinds是在请求中发送的。

下面的例子发送了一个通用的冷启动信息给远程主机，它不包含任何varbinds。

```
session.inform (snmp.TrapType.ColdStart, function (error) {
    if (error)
        console.error (error);
}); 
```

下面的例子是向远程主机发送一个企业特定的信息，并包含两个企业特定的varbinds。

```
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

session.set (varbinds, callback)
-------------------------------------------------------------------------------------------------------

`set()`方法设置一个或多个OID的值。

`varbinds`参数是一个varbind对象的数组。一旦请求完成，就会调用`callback`函数。以下参数将被传递给`callback`函数。

* `error` - `Error`类或子类的实例，如果没有发生错误，则为`null`。
* `varbinds` - varbinds数组，如果发生错误将不提供。

`varbinds`数组中N位置的varbind将与请求中`varbinds`数组中N位置的varbind相对应。除非发生错误，否则远程主机应该按照请求中指定的varbinds和它们的值回传。`varbinds`数组将包含远程主机发回的每个varbind。

当使用SNMP版本2c时，必须使用`snmp.isVarbindError()`函数检查每个varbind是否存在错误条件。

下面的例子设置了sysName(`1.3.6.1.2.1.1.4.0`)和sysLocation(`1.3.6.1.2.1.1.6.0`)OID的值。

```
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

session.subtree (oid, [maxRepetitions], feedCallback, doneCallback)
---------------------------------------------------------------------------------------------------------------------------------------------------------------------------

`subtree()`方法获取MIB树中以指定的OID为基础，按词法排列在指定OID之后的所有OID的值。例如，sysName(`1.3.6.1.2.1.1.5.0`)和sysLocation(`1.3.6.1.2.1.1.6.0`)这两个OID都有相同的基系统(`1.3.6.1.2.1.1`)OID。

对于SNMP版本1，重复调用`get()`，直到返回的一个OID不使用指定的OID作为其基础。对于SNMP版本2c，重复调用`getBulk()`，直到返回的OIDs中没有使用指定的OID作为其基础。

`oid`参数是一个OID字符串。当使用SNMP版本2c时，可选的`maxRepetitions`参数被传递给`getBulk()`请求。

一旦获取了所有的OID值，这个方法将不会调用一个回调。相反，`feedCallback`函数将在每次从远程主机收到响应时被调用。以下参数将被传递给`feedCallback`函数。

* `varbinds` - varbinds数组，至少包含一个varbind。

当使用SNMP版本2c时，必须使用`snmp.isVarbindError()`函数检查每个varbind是否存在错误条件。

一旦返回的OID中至少有一个没有使用指定的OID作为其基础，或者发生了错误，`doneCallback`函数将被调用。以下参数将被传递给`doneCallback`函数。

* `error` - `Error`类或子类的实例，如果没有发生错误，则为`null`。

一旦`doneCallback`函数被调用，请求就完成了，`feedCallback`函数将不再被调用。

如果`feedCallback`函数调用时返回`true`值，则不再调用`get()`或`getBulk()`方法，调用`doneCallback`。

下面的例子是获取系统（`1.3.6.1.2.1.1`）下的所有OID。

```
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

session.table (oid, [maxRepetitions], callback)
------------------------------------------------------------------------------------------------------------------------------------

`table()`方法获取MIB树中以指定的OID为基础的、按词法排列在指定OID之后的所有OID的值，这与`subtree()`方法很相似。

这个方法被设计用来获取概念表，例如ifTable(`1.3.6.1.2.1.2.2`)表。返回的varbinds的值将被结构化为代表概念行的对象。然后将每一行放入一个对象中，行的索引是键，例如：

```
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

本方法内部调用`subtree()`方法来获取指定表的子树。

`oid`参数是一个OID字符串。如果传递的OID字符串不代表一个表，那么产生的用于保存表数据的对象将是空的，也就是说，它将不包含索引和行。可选的`maxRepetitions`参数被传递给`subtree()`请求。

一旦整个表被获取，`callback`函数将被调用。以下参数将被传递给`callback`函数。

* `error` - `Error`类或子类的实例，如果没有发生错误，则为`null`。
* `table` -- -- 包含对象引用，代表按索引键入的概念行(例如，ifTable表的行按ifIndex键入)，每个行对象将包含按列号键入的值，如果发生错误将不提供。

如果`subtree()`返回的任何varbind发生错误，将不会向`callback`函数传递任何表。失败的原因和相关的OID字符串（从调用`snmp.varbindError()`函数返回的），将作为`RequestFailedError`类的一个实例，在`error`参数中传递给`callback`函数。

下面的例子获取ifTable(`1.3.6.1.2.1.2.2`)表。

```
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

session.tableColumns (oid, columns, [maxRepetitions], callback)
-------------------------------------------------------------------------------------------------------------------------------------------------------------------

`tableColumns()`方法实现了与`table()`方法相同的接口。但是，只有在`columns`参数中指定的列才会出现在生成的表中。

当只需要选定的列时，应该使用这个方法，并且会比`table()`方法快很多倍，因为会这会减少提取的数据量。

下面的例子是获取ifTable(`1.3.6.1.2.1.2.2`)表，并指定只获取ifDescr(`1.3.6.1.2.1.2.1.2`)和ifPhysAddress(`1.3.6.1.2.1.2.1.6`)列。

```
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

session.trap (typeOrOid, [varbinds], [agentAddrOrOptions], callback)
-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------

`trap()`方法发送一个SNMP `trap.typeOrOid`参数可以是两种类型之一。

`typeOrOid`参数可以是两种类型之一：`snmp.TrapType`对象中定义的常量之一（不包括`snmp.TrapType.EnterpriseSpecific`常量），或者一个OID字符串。

对于SNMP版本1，当指定常量时，陷阱中会设置以下字段。

* 企业字段设置为OID`1.3.6.1.4.1`。
* 企业字段设置为OID`1.3.6.1.4.1`。
* 特定陷阱字段设置为0。

当指定了OID字符串时，会在陷阱中设置以下字段。

* 从OID字符串中去掉最后的小数点，并设置在特定的陷阱字段中。
* 其余的OID字符串在企业领域设置。
* generic-trap字段设置为常数`snmp.TrapType.EnterpriseSpecific`。

在这两种情况下，陷阱PDU中的时间戳字段被设置为`process.uptime()`函数返回的值乘以`100`。

SNMP版本2c的消息与版本1相比有很大不同。2c版陷阱的格式要简单得多，只是一个varbinds的序列。陷阱消息中的第一个varbind是`sysUptime.0`的OID(`1.3.6.1.6.3.1.1.4.1.0`)。这个varbind的值将是`process.uptime()`函数返回的值乘以100(可以通过在可选的`options`参数中提供`upTime`来覆盖，如下文所述)。

这之后会有第二个varbind的`snmpTrapOID.0` OID (`1.3.6.1.6.3.1.1.4.1.0`)。这个值取决于`typeOrOid`参数。如果指定了一个常量，那么常量的陷阱OID将被用来作为varbinds的值，否则指定的OID字符串将被用来作为varbind的值。

可选的`varbinds`参数是要包含在陷阱中的varbinds数组，默认为空数组`[]`。

可选的`agentAddrOrOptions`参数可以是两种类型之一，一种是用于填充SNMP版本1类型陷阱的agent-addr字段的IP地址，默认为`127.0.0.1`，或者是一个对象，可以包含以下项目。

* `agentAddr` - 用于填充SNMP版本1类型陷阱的代理地址字段的IP地址，默认值为`127.0.0.1`。
* `upTime` - trap中`sysUptime.0` OID(`1.3.6.1.6.3.1.4.1.0`)的值，默认为`process.uptime()`函数返回的值乘以100。

**注意**当使用SNMP版本2c时，如果指定了`agentAddr`参数，则会被忽略，因为版本2c的陷阱信息没有agent-addr字段。

一旦陷阱被发送或发生错误，"callback "函数将被调用。以下参数将被传递给`callback`函数。

* `error` - `Error`类或子类的实例，如果没有发生错误，则为`null`。

以下示例使用SNMP版本1的陷阱向远程主机发送企业特定的陷阱，并在陷阱中包含sysName(`1.3.6.1.2.1.1.5.0`)varbind。在发送trap之前，`agentAddr`字段使用DNS计算出本地主机的主机名。


```
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

下面的例子使用SNMP版本1的trap向远程主机发送一个通用的link-down trap，它不包括任何varbinds或指定`agentAddr`参数。

```
session.trap (snmp.TrapType.LinkDown, function (error) {
    if (error)
        console.error (error);
}); 
```

以下示例使用SNMP版本2c trap向远程主机发送企业特定的trap，并包含两个企业特定的varbinds。

```
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

session.walk (oid, [maxRepetitions], feedCallback, doneCallback)
---------------------------------------------------------------------------------------------------------------------------------------------------------------------

`walk()`方法获取MIB树中指定的OID之后所有OID的词法值。

对于SNMP版本1，会重复调用`get()`方法，直到到达MIB树的末端。对于SNMP版本2c，会重复调用`getBulk()`，直到到达MIB树的末端。

`oid`参数是一个OID字符串。当使用SNMP版本2c时，可选的`maxRepetitions`参数被传递给`getBulk()`请求。

一旦获取了所有的OID值，这个方法将不会调用一个回调。相反，`feedCallback`函数将在每次从远程主机收到响应时被调用。以下参数将被传递给`feedCallback`函数。

* `varbinds` - varbinds数组，至少包含一个varbind。

当使用SNMP版本2c时，必须使用`snmp.isVarbindError()`函数检查每个varbind是否存在错误条件。

一旦到达MIB树的终点，或者发生了错误，`doneCallback`函数将被调用。以下参数将被传递给`doneCallback`函数。

* `error` - `Error`类或子类的实例，如果没有发生错误，则为`null`。

一旦`doneCallback`函数被调用，请求就完成了，`feedCallback`函数将不再被调用。

如果`feedCallback`函数在调用时返回一个`true`值，则不再调用`get()`或`getBulk()`方法，而调用`doneCallback`。

下面的例子从ifTable(`1.3.6.1.2.1.2.2`)OID开始走到MIB树的最后。

```
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

使用本模块 - 通知接收机
==========================================================================================================================

RFC 3413对接收 "通知类 "PDU的SNMP应用进行了分类。通知包括SNMP陷阱和通知。该库能够接收所有类型的通知PDU。

* `Trap-PDU`（原来的v1 trap PDU，现在被认为是obselete）。
* "Trapv2-PDU"(未确认的通知)
* "InformRequest-PDU"(与 "Trapv2-PDU "格式相同，但有信息确认)

该库提供了一个用于接收SNMP通知的`Receiver`类。该模块输出`createReceiver()`函数，创建一个新的`Receiver`实例。

接收器创建一个`Authorizer`实例来控制传入的访问。更多细节见下面的[Authorizer模块](https://www.npmjs.com/package/net-snmp#authorizer-module)部分。

snmp.createReceiver (options, callback)
---------------------------------------------------------------------------------------------------------------------

`createReceiver()`函数实例化并返回一个`Receiver`类的实例。

```
// Default options
var options = {
    port: 162,
    disableAuthorization: false,
    accessControlModelType: snmp.AccessControlModelType.None,
    engineID: "8000B98380XXXXXXXXXXXX", // where the X's are random hex digits
    address: null
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

`选项'和`回调'参数是强制性的。`options`参数是一个对象，可以是空的，可以包含以下字段： * `port` - 侦听通知的端口 - 默认为162。

* `port`--监听通知的端口--默认为162。请注意，在某些系统中，绑定到162端口需要接收器进程以管理权限运行。如果不可能，则选择一个大于1024的端口。
* `disableAuthorization`--对所有收到的基于社区的通知以及对收到的基于用户的通知，如果没有消息认证或隐私(noAuthNoPriv)，则禁用本地授权--默认为false。
* `engineID` -- -- 用于SNMPv3通信的引擎ID，以十六进制字符串形式给出 -- -- 默认为系统生成的引擎ID，包含随机元素。
* `transport` -- -- 要使用的传输系列 -- -- 默认为`udp4`。
* `address` -- -- 要绑定的IP地址 -- -- 默认为`null`，即绑定到所有IP地址。

`callback`参数是一个回调函数，其形式为`function (error, notification)`。在发生错误时，"notification "参数被设置为 "null"。当成功接收到一个通知时，错误参数被设置为`null`，`notification`参数被设置为一个对象，在`pdu`字段中包含通知PDU细节，在`rinfo`字段中包含发送方socket细节。例如：

```
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

receiver.getAuthorizer ()
------------------------------------------------------------------------------------------

返回接收器的`Authorizer`实例，用于控制对接收器的访问。更多细节请参见 "Authorizer "部分。

receiver.close ()
--------------------------------------------------------------------------

关闭接收机的监听插座，结束接收机的操作。

使用本模块 - SNMP代理
====================================================================================================

SNMP代理响应与命令响应器应用相关的所有四个 "请求类 "PDU。

* **GetRequest** - 请求完全匹配的OID实例。
* **GetNextRequest** - 在MIB树中请求词法上的 "下一个 "OID实例。
* **GetBulkRequest** - 请求MIB树中的一系列 "下一个 "OID实例。
* **SetRequest** - 为指定的OID设置数值。

代理发送**GetResponse** PDU到所有四种请求PDU类型，符合RFC 3416。

代理--和通知接收方一样--维护一个`Authorizer`实例来控制对代理的访问，详细内容见下面的[Authorizer模块](https://www.npmjs.com/package/net-snmp#authorizer-module)部分。

代理维护的中央数据结构是一个`Mib`实例，其API详见下面的[Mib模块](https://www.npmjs.com/package/net-snmp#mib-module)部分。代理允许通过API对MIB进行查询和操作，也允许通过SNMP接口与上述四个请求类PDU进行查询和操作。

该代理还通过其单人`Forwarder`实例支持SNMP代理转发应用，这在下面的[Forwarder模块](https://www.npmjs.com/package/net-snmp#forwarder-module)部分有说明。

snmp.createAgent (options, callback, mib)
------------------------------------------------------------------------------------------------------------------------

`createAgent()`函数实例化并返回一个`Agent`类的实例。

```
// Default options
var options = {
    port: 161,
    disableAuthorization: false,
    accessControlModelType: snmp.AccessControlModelType.None,
    engineID: "8000B98380XXXXXXXXXXXX", // where the X's are random hex digits
    address: null
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
```

`选项'和`回调'参数是强制性的。`options`参数是一个对象，可以是空的，可以包含以下字段。

* `port`--代理要监听的端口--默认为161。请注意，在某些系统上绑定到161端口需要接收方进程以管理权限运行。如果无法做到这一点，则选择一个大于1024的端口。
* `disableAuthorization`--对于收到的所有基于社区的通知和基于用户的通知，如果没有消息认证或隐私(noAuthNoPriv)，则禁用本地授权--默认为false。
* `accessControlModelType` -- -- 指定使用哪种访问控制模型。默认值为`snmp.AccessControlModelType.None`，但可以设置为`snmp.AccessControlModelType.Simple`，以获得更多的访问控制能力。更多信息请参见`Authorization`类描述。
* `engineID`--用于SNMPv3通信的引擎ID，给定为十六进制字符串--默认为系统生成的引擎ID，包含随机元素。
* `transport` -- -- 要使用的传输系列 -- -- 默认为`udp4`。
* `address` -- -- 要绑定的IP地址 -- -- 默认为`null`，即绑定到所有IP地址。

`mib`参数是可选的，它设置了代理的单体`Mib`实例。如果不提供，代理会给自己创建一个新的空的`Mib`单体。如果提供，则需要按照下面的[Mib模块](https://www.npmjs.com/package/net-snmp#mib-module)部分来创建和填充`Mib`实例。

agent.getAuthorizer ()
------------------------------------------------------------------------------------

返回代理的单人`Authorizer`实例，用于控制对代理的访问。更多细节请参见 "Authorizer "部分。

agent.getMib ()
----------------------------------------------------------------------

返回Mib单例。

agent.setMib (mib)
----------------------------------------------------------------------------

将代理的单`Mib`实例设置为提供的实例。代理商放弃其现有的`Mib`实例。

agent.getForwarder ()
----------------------------------------------------------------------------------

返回代理的单 "Forwarder "实例，该实例持有注册的代理列表，该代理指定基于上下文转发到远程主机。

agent.close ()
--------------------------------------------------------------------

关闭代理的监听套接字，结束代理的操作。

Authorizer Module
=============================================================================

接收器和代理都维护一个单例的 "Authorizer "实例，它负责维护SNMP社区的授权列表（针对v1和v2c通知）和SNMP用户的授权列表（针对v3通知）。这些列表用于授权接收方对通知的访问，并存储安全协议和密钥设置。RFC 3414将用户列表称为存储在接收器的 "本地配置数据库 "中的 "usmUserTable"。

如果收到的v1或v2c通知中的社区不在接收器的社区授权列表中，接收器将不接受该通知，而是向提供的回调函数返回一个类`RequestFailedError`的错误。类似的，如果接收到一个v3通知，其用户名称不在接收者的用户授权列表中，接收者将返回一个`RequestFailedError`。如果在启动时为接收器提供了`disableAuthorization`选项，那么对于社区通知和noAuthNoPriv用户通知，这些本地授权列表检查将被禁用。请注意，即使有这个设置，用户列表仍然会对 authNoPriv 和 authPriv 通知进行检查，因为库仍然需要访问正确的密钥来进行消息认证和加密操作，而这些密钥是针对用户授权列表中的用户存储的。

API允许对接收者/代理的社区授权和用户授权列表进行添加、查询和删除管理。

对于代理来说，还有一个可选的访问控制检查，它可以根据代理提供的作为选项的`AccessControlModelType`来限制给定社区或用户的访问。默认的模型类型是`snmp.AccessControlModelType.None`，这意味着--在前面几段描述的授权列表检查之后，没有进一步的访问控制限制，即所有请求都被代理授予访问权。可以选择第二个访问控制模型类型`snmp.AccessControlModelType.Simple`，它创建了一个`SimpleAccessControlModel`对象，该对象可以被操作，以指定社区或用户对代理信息具有三个级别的访问权限之一。

* 无
* 只读
* 读写器

关于如何使用 "SimpleAccessControlModel "类配置访问的更多信息，将在下面对该类的描述中提供。

授权器实例可以通过使用`getAuthorizer()`调用获得，对于接收方和代理方来说都是如此。例如：

```
receiver.getAuthorizer ().getCommunities (); 
```

authorizer.addCommunity (community)
--------------------------------------------------------------------------------------------------------------

在接收者的社区授权列表中添加一个社区字符串。如果社区已经在列表中，则不做任何操作，确保列表中任何给定的社区字符串只出现一次。

authorizer.getCommunity (community)
--------------------------------------------------------------------------------------------------------------

如果接收者的社区授权列表中存储了一个社区字符串，则返回 "null"，否则返回 "null"。

authorizer.getCommunities ()
------------------------------------------------------------------------------------------------

返回接收者的社区授权列表。

authorizer.deleteCommunity (community)
--------------------------------------------------------------------------------------------------------------------

从接收者的社区授权列表中删除一个社区字符串。如果社区不在列表中，则不做任何操作。

authorizer.addUser (user)
------------------------------------------------------------------------------------------

在接收方的用户授权列表中添加一个用户。如果列表中存在同名用户，则该调用将删除现有用户，并以提供的用户取而代之，确保列表中只存在一个同名用户。用户对象的格式与`session.createV3Session()`调用的格式相同。

```
var user = {
    name: "elsa"
    level: snmp.SecurityLevel.authPriv,
    authProtocol: snmp.AuthProtocols.sha,
    authKey: "imlettingitgo",
    privProtocol: snmp.PrivProtocols.des,
    privKey: "intotheunknown"
};

receiver.getAuthorizer ().addUser (elsa); 
```

authorizer.getUser (userName)
--------------------------------------------------------------------------------------------------

如果接收者的用户授权列表中存储了一个使用所提供名字的用户，则返回一个用户对象，否则返回`null`。

authorizer.getUsers ()
------------------------------------------------------------------------------------

返回接收方的用户授权列表。

authorizer.deleteUser (userName)
--------------------------------------------------------------------------------------------------------

从接收方的用户授权列表中删除一个用户。如果提供的用户名称不在列表中，则不做任何操作。


authorizer.getAccessControlModelType ()
----------------------------------------------------------------------------------------------------------------------

返回该授权器的`snmp.AccessControlModelType`，它是其中之一。

*   `snmp.AccessControlModelType.None`
*   `snmp.AccessControlModelType.Simple`

authorizer.getAccessControlModel ()
--------------------------------------------------------------------------------------------------------------

返回访问控制模型对象。

*   for a type of `snmp.AccessControlModelType.None` - returns null (as the access control check returns positive every time)
*   for a type of `snmp.AccessControlModelType.Simple` - returns a `SimpleAccessControlModel` object

Simple Access Control Model
=================================================================================================

`SimpleAccessControlModel'类可以选择作为`Agent'使用的访问控制模型。`SimpleAccessControlModel`为给定的社区或用户提供基本的三级访问控制。访问级别由snmp.AccessLevel常量指定。

* `snmp.AccessLevel.None`--不授予社区或用户任何访问权。
* `snmp.AccessLevel.ReadOnly` -- -- 允许社区或用户访问Get、GetNext和GetBulk请求，但不允许访问Set请求。
* `snmp.AccessLevel.ReadWrite` -- -- 允许社区或用户访问Get、GetNext、GetBulk和Set请求。

`SimpleAccessControlModel`不是通过直接的API调用创建的，而是由`Agent`的`Authorizer`单人在内部创建的。所以可以用以下方法访问代理的访问控制模型。

```
var acm = agent.getAuthorizer ().getAccessControlModel (); 
```

请注意，本节中任何 API 调用中使用的任何社区或用户都必须首先在代理的 "授权者 "中创建，否则代理将无法通过授权者执行的初始社区/用户列表检查。

当使用简单访问控制模型时，`Authorizer`中新创建的社区或用户的默认访问级别是只读。

Example use:

```
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

simpleAccessControlModel.setCommunityAccess (community, accessLevel)
-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

授予给定的社区给定的访问级别。

simpleAccessControlModel.removeCommunityAccess (community)
------------------------------------------------------------------------------------------------------------------------------------------------------------

删除指定社区的所有访问。

simpleAccessControlModel.getCommunityAccessLevel (community)
----------------------------------------------------------------------------------------------------------------------------------------------------------------

返回指定社区的访问级别。

simpleAccessControlModel.getCommunitiesAccess ()
----------------------------------------------------------------------------------------------------------------------------------------

返回该访问控制模型定义的所有社区访问控制条目的列表。

simpleAccessControlModel.setUserAccess (userName, accessLevel)
-------------------------------------------------------------------------------------------------------------------------------------------------------------------

给予用户指定的访问级别。

simpleAccessControlModel.removeUserAccess (userName)
------------------------------------------------------------------------------------------------------------------------------------------------

删除指定用户的所有访问权限。

simpleAccessControlModel.getUserAccessLevel (userName)
----------------------------------------------------------------------------------------------------------------------------------------------------

返回指定用户的访问级别。

simpleAccessControlModel.getUsersAccess ()
----------------------------------------------------------------------------------------------------------------------------

返回该访问控制模型定义的所有用户访问控制项的列表。

Mib Module
===============================================================

`代理'实例在创建时，又创建了`Mib'类的一个实例。一个代理总是有且只有一个`Mib`实例。通过`agent.getMib()`调用来访问代理的`Mib`实例。

MIB是一个树状结构，它保存着管理信息。信息在树中由一系列整数 "寻址"，这些整数从树的根部向下形成一个对象ID（OID）。

在MIB中，只有两种数据结构可以保存数据。

**标量**数据--标量变量存储在MIB树的某个节点上，变量的值是标量变量节点的单个子节点，地址总是 "0"。例如，sysDescr标量变量的地址为 "1.3.6.1.2.1.1.1"。sysDescr变量的值存储在 "1.3.6.1.2.1.1.0"
    
    ```
    1.3.6.1.2.1.1.1 <= sysDescr (标量变量)
    1.3.6.1.2.1.1.0 = OctetString: MyAwesomeHost <= sysDescr.0 (标量变量值) 
    ```
    
***表***数据--SNMP表以列和行的形式存储数据。通常情况下，如果一个表存储在MIB中的某个节点上，那么在表OID的正下方有一个地址为 `1 `的 `条目 `对象。在 `条目 `的正下方是一个列的列表，这些列的编号通常是从 `1 `往上的。在每一列的下面是一系列的行。在最简单的情况下，一行的 `索引`是表中的一列，但行索引可以是一系列的列，也可以是给出多个整数的列（如一个IPv4地址的索引有四个整数），或者两者都有。下面是ifTable中部分SNMP表的层次结构的例子。
    
```
1.3.6.1.2.1.2.2 <= ifTable (table)
1.3.6.1.2.1.2.2.1 <= ifEntry (表项)
1.3.6.1.2.1.2.2.1.1 <= ifIndex (第1栏)
1.3.6.1.2.1.2.1.1 = Integer: 1 <= ifIndex row 1 value = 1。
1.3.6.1.2.1.2.2.1.1.2 = Integer: 2 <= ifIndex row 2 value = 2。
```


在创建时，"Agent "实例会创建一个 "Mib "模块的单人实例。然后，您可以向代理的`Mib`实例注册一个 "提供者"，它为标量数据实例或表提供一个接口。

```
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
```

这段代码首先给出了标量 "提供者 "的定义。在`mib.registerProvider()`部分对这些字段做了进一步的解释。重要的是，`name`字段是提供者的唯一标识符，在后续的API调用中用于选择特定的提供者。

`registerProvider()`调用将提供者添加到MIB持有的提供者列表中。请注意，这个调用不会将 "oid "节点添加到MIB树中。第一次调用`setScalarValue()`将把实例OID "1.3.6.1.2.1.1.1.0 "连同其值一起添加到MIB树中。

此时，当通过SNMP查询实例OID "1.3.6.1.1.2.1.1.1.0 "时，代理将提供该MIB节点的值。

一个表提供者也有类似的定义。

```
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
            type: snmp.ObjectType.Integer,
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

在这里，提供者的定义需要两个添加字段。`tableColumns`表示列的定义，`tableIndex`表示用于行索引的列。在本例中，`tableIndex`是`ifIndex`列。`mib.registerProvider()`部分有关于构成提供者定义的字段的进一步细节。

`oid`必须是 "表条目 "节点的节点，而不是它的父 "表 "节点，例如对于`ifTable`，提供者中的`oid`是 "1.3.6.1.2.1.2.2.1"（`ifEntry`的OID）。

请注意，在这个特殊的例子中，没有`handler`回调函数，所以任何交互都是直接在SNMP请求和MIB值之间进行，没有其他干预。

snmp.createMib ()
--------------------------------------------------------------------------

`createMib()`函数实例化并返回一个`Mib`类的实例。新的Mib没有任何节点（除了一个根节点），也没有任何注册的提供者。

请注意，这只适用于代理，而不是AgentX子代理。由于代理在创建时就会实例化一个`Mib`实例，所以在很多情况下不需要这个调用。有两种情况可能会用到它。

* 在创建Agent实例之前，你想用提供者和标量/表格数据预先填充一个`Mib`实例。
* 你想把一个代理的现有`Mib`实例换成一个全新的实例。

mib.registerProvider (definition)
----------------------------------------------------------------------------------------------------------

在MIB中注册一个提供者定义。不向MIB树添加任何内容。

提供者定义有以下几个字段： `name` _(强制性的)_ - 提供者的名称。

* `name` _(强制)_ - 提供方的名称，它是获取和设置值时引用提供方的唯一键。
* `type` _(强制性)_ - 必须是`snmp.MibProviderType.Scalar`或`snmp.MibProviderType.Table`(强制性)
* `oid`_(必须填写)_ -提供者在MIB树中注册的OID。请注意，这不是的 "实例节点"（".0 "节点），而是它上面的节点。在这种情况下，提供者在 "1.3.6.1.2.1.1.1 "处注册，以提供 "1.3.6.1.2.1.1.0 "处的值。
* `scalarType` _(标量类型必须填写)_ -只与标量提供者类型相关，这给出了变量的类型，从`snmp.ObjectType`中选择。
* `tableColumns` _(表类型必须填写)_ -- -- 提供表的任何列定义对象数组。每个列对象必须有一个独特的`数字'、`名称'和`snmp.ObjectType'的`类型'。类型为`ObjectType.Integer`的列对象可以选择性地包含一个`constraints`对象，其格式和含义与在单个标量提供者上定义的对象相同（具体内容见下文`constraints`）。
* `tableIndex` _(表类型可选)_ -给出一个用于行索引的索引入口对象数组。对于单列索引使用单元素数组，对于复合索引使用多个值。一个索引条目对象有一个`columnName`字段，如果条目在另一个提供者的表中，那么包括一个`foreign`字段，写上外表提供者的名称。如果没有`tableAugments`字段，`tableIndex`是必须的。
* `tableAugments` _(表类型可选)_ -给出本表 "增强 "的另一个注册提供者的名称。这意味着索引信息是从给定提供者的表中获取的，并且不存在于本地表的列定义中。如果`tableIndex`字段不存在，`tableAugments`是必须的，即`tableIndex`和`tableAugments`中的一个需要存在，才能定义表的索引。
* `handler` _(optional)_ - 一个可选的回调函数，在向MIB提出请求之前被调用。这可以更新这个提供者处理的MIB值。如果没有给定，那么这些值将被简单地从MIB中返回（或设置），而不需要任何其他处理。回调函数需要一个`MibRequest`实例，它有一个`done()`函数。当处理完请求时，必须调用这个函数。`MibRequest`也有一个`oid`字段，写着被操作的实例OID，还有一个`operation`字段，写着来自`snmp.PduType`的请求类型。如果 "MibRequest "是针对 "SetRequest "PDU的，那么变量 "setValue "和 "setType "就包含了 "SetRequest "varbind中接收到的值和类型。
* `constraints` _(对于标量类型是可选的)_ - 一个可选的对象，用于指定基于整数的枚举类型的约束。目前唯一支持的约束是`enumeration`对象，它将整数映射到它们的命名类型，以捕获RFC 2578第7.1.1节中描述的 "命名数枚举"。任何SetRequest协议操作都会根据定义的约束条件进行检查，如果SetRequest中的值会违反约束条件，例如该值不是定义的枚举的成员，则不会采取行动。请注意，表列可以以相同的方式指定这样的 "约束"，只是这些约束存储在每个列的列对象定义下。

在向MIB注册提供者后，在其他API调用中，提供者由其`名称`引用。

虽然这个调用将提供者注册到MIB，但它不会改变MIB树。

mib.registerProviders ( [definitions] )
----------------------------------------------------------------------------------------------------------------------

一次调用注册提供者数组的方便方法。简单地调用 "registerProvider() "来注册数组中的每个提供者定义。

mib.unregisterProvider (name)
--------------------------------------------------------------------------------------------------

从MIB中取消注册一个提供者。这也将从提供者的`oid`节点向下删除所有MIB节点。它还将对MIB树上游的任何内部MIB节点进行修剪，这些节点仅在MIB树到达提供者`oid`节点时存在。

mib.getProviders ()
------------------------------------------------------------------------------

返回在MIB中注册的提供者定义的对象，按提供者名称索引。

mib.getProvider (name)
------------------------------------------------------------------------------------

返回给定名称的单个注册提供者对象。

mib.getScalarValue (scalarProviderName)
----------------------------------------------------------------------------------------------------------------------

从一个标量提供者那里检索值。

mib.setScalarValue (scalarProviderName, value)
-----------------------------------------------------------------------------------------------------------------------------------

设置标量提供者的值。如果这是该提供者向MIB注册后第一次设置标量，那么它还会将实例（".0"）节点和所有所需的祖先添加到MIB树中。

mib.addTableRow (tableProviderName, row)
-----------------------------------------------------------------------------------------------------------------------

将表行--以值数组的形式--添加到表提供者。如果表是空的，则在添加值行之前，实例化提供者的`oid`节点和祖先，即其列。请注意，该行是一个按照表列顺序排列的元素数组。如果表有任何外来索引列（即那些不属于本表的索引列），那么这些列的值必须按照它们在MIB INDEX子句中出现的顺序，包含在行数组的开头。

mib.getTableColumnDefinitions (tableProviderName)
------------------------------------------------------------------------------------------------------------------------------------------

返回提供者的列定义对象列表。

mib.getTableCells (tableProviderName, byRow, includeInstances)
------------------------------------------------------------------------------------------------------------------------------------------------------------------

返回表格数据的二维数组。如果`byRow`为false(默认)，那么表格数据是以列数组列表的形式给出的，即按列给出。如果`byRow`是`true`，那么数据就是一个行数组的列表。如果`includeInstances`是`true`，那么，对于列视图，将有一个额外的第一列的实例索引信息。如果行视图中`includeInstances`为`true`，那么在每一行的开始会有一个附加元素，包含索引信息。

mib.getTableColumnCells (tableProviderName, columnNumber, includeInstances)
--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

返回给定列号的单列表数据。如果 "includeInstances "为 "true"，则返回两个数组：第一个数组包含实例索引信息，第二个数组包含列数据。

mib.getTableRowCells (tableProviderName, rowIndex)
-------------------------------------------------------------------------------------------------------------------------------------------

返回给定行索引的单行表数据。行索引是一个由索引值组成的数组，从紧挨着列下的节点到行实例末尾的节点，这将是MIB树中的一个叶子节点。最终，非整数值需要转换为整数序列，构成OID的实例部分。下面是将索引值转换为行实例OID序列的细节。

* **ObjectType.Integer** - 单个整数。
* **ObjectType.OctetString** - 一个ASCII值的整数序列。
* **ObjectType.OID** - OID中的确切整数序列。
* **ObjectType.IpAddress** - IP地址中四个整数的序列。

mib.getTableSingleCell (tableProviderName, columnIndex, rowIndex)
------------------------------------------------------------------------------------------------------------------------------------------------------------------------

返回指定列和行的单个单元格值。行索引数组的指定方式与`getTableRowCells()`调用相同。

mib.setTableSingleCell (tableProviderName, columnIndex, rowIndex, value)
-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

在指定的列和行设置一个单元格值。行索引数组的指定方式与`getTableRowCells()`调用相同。

mib.deleteTableRow (tableProviderName, rowIndex)
---------------------------------------------------------------------------------------------------------------------------------------

在指定的行索引处删除表的一行。行索引数组的指定方式与`getTableRowCells()`调用相同。如果这是表的最后一行，表就会从MIB中被修剪掉，尽管提供者仍然在MIB中注册。这意味着，在增加另一行时，该表将被再次实例化。

mib.dump (options)
----------------------------------------------------------------------------

以文本格式转储MIB。`options`对象通过这些选项字段控制转储的显示（所有选项都是布尔值，默认为`true`）。

* `leavesOnly`--不单独显示内部节点--只显示叶子节点的前缀部分（实例节点）。
* `showProviders` -- -- 显示提供者与MIB相连的节点。
* "showTypes" -- -- 显示实例价值类型。
* `showValues` - 显示实例值。

For example:

```
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

Using This Module: Module Store
========================================================================================================

该库支持MIB解析，为`ModuleStore`实例提供了一个接口，您可以从文件中加载MIB模块，并获取由此产生的JSON MIB模块表示。

此外，一旦一个MIB被加载到模块存储中，你就可以生成一个MIB "提供者 "定义的列表，一个 "代理 "可以注册（更多细节请参见 "代理 "文档），这样你就可以马上开始操作你的MIB文件中定义的所有值。

```
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

// Then hit those bad boys with your favourite SNMP tools (or library ;-), e.g.
snmpwalk -v 2c -c public localhost 1.3.6.1 
```

这意味着您可以用最少的模板代码直接实现您的MIB功能。

snmp.createModuleStore ()
------------------------------------------------------------------------------------------

创建一个新的`ModuleStore`实例，该实例预装了一些 "基础 "MIB模块，这些模块提供了其他MIB模块常用的MIB定义（"导入"）。预装的 "基础 "模块列表如下：

*   RFC1155-SMI
*   RFC1158-MIB
*   RFC-1212
*   RFC1213-MIB
*   RFC-1215
*   SNMPv2-SMI
*   SNMPv2-CONF
*   SNMPv2-TC
*   SNMPv2-MIB

store.loadFromFile (fileName)
--------------------------------------------------------------------------------------------------

将给定文件中的所有MIB模块加载到模块存储中。按照惯例，每个文件中通常只有一个MIB模块，但一个文件中可以存储多个模块定义。然后，加载的MIB模块被这个API用它们的MIB模块名而不是源文件名来引用。MIB模块名是MIB文件中`DEFINITIONS ::= BEGIN`前面的名称，通常是MIB文件中最先出现的东西。

请注意，如果您的MIB依赖于（"导入"）其他MIB文件中的定义，则必须首先加载这些定义，例如，流行的**IF-MIB**使用了来自**IANAifType-MIB**的定义，因此必须首先加载。这些依赖关系列在MIB模块的**IMPORTS**部分，通常在MIB文件的顶部。预先加载的 "基础 "MIB模块包含了许多常用的导入。

store.getModule (moduleName)
------------------------------------------------------------------------------------------------

以JSON对象的形式从存储中检索命名的MIB模块。

store.getModules (includeBase)
----------------------------------------------------------------------------------------------------

从store中检索所有的MIB模块，如果`includeBase`boolean被设置为true，那么基本的MIB模块就会被包含在列表中。如果 "includeBase "布尔值被设置为true，那么基本的MIB模块就被包含在列表中。模块作为一个单一的JSON "对象中的对象 "返回，以模块名称为键，其值是整个JSON模块的表示。

store.getModuleNames (includeBase)
------------------------------------------------------------------------------------------------------------

检索商店中加载的所有MIB模块名称的列表。如果 "includeBase "布尔值被设置为true，那么MIB模块的基本名称就会被包含在列表中。

store.getProvidersForModule (moduleName)
------------------------------------------------------------------------------------------------------------------------

返回一个`Mib`"提供者 "定义的数组，该数组对应于命名的MIB模块中包含的所有标量和表实例对象。然后，通过使用`agent.getMib().registerProviders()`调用，提供者定义列表就可以被注册到代理的MIB中。

Forwarder Module
===========================================================================

`代理'实例在创建后，又会创建`Forwarder'类的实例。没有直接的API调用来创建 "Forwarder "实例；这种创建是代理的责任。一个代理总是只有一个`Forwarder`实例。代理的`Forwarder`实例是通过`agent.getForwarder()`调用来访问的。

`Forwader`就是RFC 3413所说的 "代理转发应用"。它维护着一个 "代理 "条目列表，每个条目都配置了一个命名的SNMPv3上下文名称，以使用户凭证能够访问给定的目标主机。`Forwarder`只支持SNMPv3会话的代理。

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

现在，使用所提供的 "slatescontext "上下文向代理发出的请求将被转发到主机 "bedrock"，并使用所提供的用户 "slate "的证书。

你可以使用本地代理用户（与代理的`Authorizer`实例一起添加）查询代理。假设你的代理运行在localhost，161端口，你可以添加本地用户 "fred"，然后用新的 "fred "用户访问代理。

```
var authorizer = agent.getAuthorizer();
authorizer.addUser ({
    name: "fred",
    level: snmp.SecurityLevel.noAuthNoPriv
});

// Test access using Net-SNMP tools (-n is the context option):

snmpget -v 3 -u fred -l noAuthNoPriv -n slatescontext localhost 1.3.6.1.2.1.1.1.0 
```

根据代理的定义，该代理将请求传递给主机 "bedrock"。

forwarder.addProxy (proxy)
--------------------------------------------------------------------------------------------

为转发者添加一个新的代理。代理是一个包含以下字段的对象。

* `context` _(强制)_ - 这个代理条目的SNMPv3上下文名称。这是代理条目的唯一键，即不能有两个代理条目的上下文名称相同。
* `transport` _(可选)_ - 指定到达远程目标的传输。可以是`udp4`或`udp6`，默认为`udp4`。
* `target` _(强制)_ - 接收代理请求的远程主机。
* `port` _(可选)_ - 远程主机上SNMP代理的端口。默认值为161。
* `user` _(必填)_ - SNMPv3用户。用户的格式在`createV3Session()`调用文档中描述。

forwarder.deleteProxy (context)
------------------------------------------------------------------------------------------------------

从转发者中删除给定上下文的代理。

forwarder.getProxy (context)
------------------------------------------------------------------------------------------------

返回给定上下文的转发者的代理。

forwarder.getProxies ()
--------------------------------------------------------------------------------------

返回一个包含所有注册代理的列表的对象，按上下文名称键入。

forwarder.dumpProxies ()
----------------------------------------------------------------------------------------

打印所有代理定义的转储到控制台。

Using This Module: AgentX Subagent
==============================================================================================================

AgentX子代理实现了RFC 2741中指定的功能，成为AgentX "主代理 "的一个 "子代理"。AgentX的目标是通过一个单独的 "子代理 "来扩展现有的 "主代理 "SNMP代理的功能，注册它想为主代理管理的MIB树的部分。

除了两个 "管理 "PDU类型外，AgentX子代理支持生成所有的PDU类型，所有的PDU都是从子代理发送到主代理的。

* **Open PDU**--打开与主代理的新会话
* **关闭PDU** - 关闭与主代理的现有会话。
* **注册PDU** -- -- 注册一个MIB区域，以便与主代理进行控制。
* **解除注册PDU** -- -- 解除以前向主代理注册的MIB区域的注册。
* **Notify PDU** - 向主代理发送通知。
* **Ping PDU** - 发送 "Ping "以确认主代理仍然可用。
* **AddAgentCaps PDU** - 在主代理的sysORTable中添加代理功能。
* **RemoveAgentCaps PDU**--从主代理的sysORTable中删除以前添加的代理功能。

两种不支持的 "管理 "PDU类型是： * **IndexAllocate PDU** - 请求从索引由主代理管理的表分配索引。

* **IndexAllocate PDU**--请求分配由主代理管理索引的表的索引。
* **IndexDeallocate PDU** -- -- 请求从主代理的表中重新分配以前分配的索引。

这些都是不支持的，因为它们不适合当前的MIB提供者注册模型，该模型只支持注册标量和整个表格。将来可以通过进一步概括注册模型来支持表行注册来支持这些。

子代理响应所有与命令响应者应用相关的 "请求处理 "PDU类型，这些类型是从主代理接收的。

* **Get PDU**--请求完全匹配的OID实例。
* **GetNext PDU**--请求MIB树中的词法 "下一个 "OID实例。
* **GetBulk PDU** -- -- 请求MIB树中一系列的 "下一个 "OID实例。
* **TestSet PDU** - 测试将作为单一事务提交的 "集 "操作列表。
* **CommitSet PDU** - 将一系列 "set "操作作为单一事务提交。
* **UndoSet PDU** -- -- 将 "set "操作列表作为单一事务撤销。
* **CleanupSet PDU** -- -- 结束 "设置 "事务。

根据 RFC 2741，除了 **CleanupSet** PDU 外，所有这些都会返回一个 **Response** PDU 给主代理。

与SNMP代理一样，AgentX子代理维护的是一个`Mib`实例，其API在上面的[Mib模块](https://www.npmjs.com/package/net-snmp#mib-module)部分有详细介绍。子代理允许通过API查询和操作MIB，也允许通过AgentX接口查询和操作上述 "请求处理 "PDU（当主代理调用其SNMP接口时，主代理会产生）。

重要的是，MIB提供者是使用子代理的`subagent.registerProvider()`调用来注册的(如下所述)，而不是使用`subagent.getMib().registerProvider()`，因为子代理既需要在其内部`Mib`对象上注册提供者，_又需要为提供者的MIB区域发送一个Register PDU给主代理。如果直接在MIB对象上注册提供者，则跳过后一步_。

snmp.createSubagent (options)
--------------------------------------------------------------------------------------------------

`createSubagent()`函数实例化并返回一个`Subagent`类的实例。

```
// Default options
var options = {
    master: localhost
    masterPort: 705,
    timeout: 0,
    description: "Node net-snmp AgentX sub-agent",
};

subagent = snmp.createSubagent (options); 
```

`options`参数是一个强制性对象，可能为空，可包含以下字段。

* `master` - 主代理的主机名或IP地址，子代理连接到该主机。
* `masterPort`--子代理连接到主代理的TCP端口，默认为705。
* `timeout` - 设置主代理的会话范围超时 - 默认值为0，即没有设置会话范围超时。
* `description`--子代理的文字描述。

subagent.getMib ()
----------------------------------------------------------------------------

返回代理的单`Mib`实例。 在创建子代理时自动创建，并保存子代理的所有管理数据。

subagent.open (callback)
----------------------------------------------------------------------------------------

向主代理发送 "Open "PDU以打开一个新的会话，并在主代理响应时调用回调。

subagent.close (callback)
------------------------------------------------------------------------------------------

向主代理发送 "关闭 "PDU，关闭子代理与主代理的会话，在主代理响应时调用回调。

subagent.registerProvider (provider, callback)
-----------------------------------------------------------------------------------------------------------------------------------

关于提供者的定义，请参见`Mib`类`registerProvider()`调用。对于这个调用，`provider`对象的格式和意义是一样的。这将向主站发送一个`Register`PDU来注册MIB的一个区域，主站将为这个区域向子代理发送 "请求处理 "PDU。所提供的 "回调 "只使用一次，在接收到主站对 "Register "PDU的后续 "Response "PDU时使用。这不能与提供者定义中的可选回调 "handler "相混淆，后者对子代理收到的任何 "请求处理 "PDU都会被调用，用于注册MIB区域中的MIB对象。

subagent.unregisterProvider (name, callback)
-------------------------------------------------------------------------------------------------------------------------------

通过提供的提供者的名称来解除对以前注册的MIB区域的注册。向主代理发送一个 "解除注册 "PDU来完成这项工作。所提供的 "回调 "只使用一次，在收到主代理的后续 "响应 "PDU时才会使用 "Unregister "PDU。

subagent.registerProviders ( [definitions], callback )
---------------------------------------------------------------------------------------------------------------------------------------------------

一次调用注册提供者数组的方便方法。简单地对数组中的每个提供者定义调用`registerProvider()`。对于每个注册的提供者，"回调 "函数被调用一次。

subagent.getProviders ()
----------------------------------------------------------------------------------------

返回在MIB中注册的提供者定义的对象，按提供者名称索引。

subagent.getProvider (name)
----------------------------------------------------------------------------------------------

Returns a single registered provider object for the given name.

subagent.addAgentCaps (oid, descr, callback)
------------------------------------------------------------------------------------------------------------------------------

将一个由`oid`和`descr`组成的代理能力添加到主代理的sysORTable中。向主代理发送一个 "AddAgentCaps "PDU来完成这项工作。当收到主代理发送的后续 "Response "PDU到 "AddAgentCaps "PDU时，会调用所提供的 "callback"。

subagent.removeAgentCaps (oid, callback)
-----------------------------------------------------------------------------------------------------------------------

从主代理的sysORTable中删除之前添加的能力。向主代理发送一个 "RemoveAgentCaps "PDU来完成这个操作。当收到主代理发送的后续 "Response "PDU到 "RemoveAgentCaps "PDU时，会调用提供的 "callback"。

subagent.notify (typeOrOid, varbinds, callback)
------------------------------------------------------------------------------------------------------------------------------------

使用`Notify`PDU向主代理发送通知。通知的形式与上面`session.inform()`部分以及RFC 2741第6.2.10节中概述的相同，即创建两个varbinds，始终包含在通知中。

* sysUptime.0(1.3.6.1.2.1.1.3.0)--包含子代理的运行时间。
* snmpTrapOID.0 (1.3.6.1.6.3.1.1.4.1.0) -- -- 包含所提供的OID(或所提供的`snmp.TrapType`值)；

可选的 "varbinds "列表是一个附加的varbind对象列表，用于附加到上述两个varbinds。所提供的`callback`在收到主站随后的`Response`PDU和`Notify`PDU时被调用。

subagent.ping (callback)
----------------------------------------------------------------------------------------

使用 "Ping "PDU向主代理发送 "ping"，以确认主代理仍在响应。提供的 "回调 "在接收到主代理对 "Ping "PDU的后续 "Response "PDU时被调用。

Example Programs
===========================================================================

示例程序包含在模块的`example`目录下。

变化
----------------------------------------------------------------------------------------
### 版本1.0.0 - 14/01/2013
初始版本仅包括SNMP版本1的支持
### 版本1.1.0 - 20/01/2013
实施SNMP 2c版本支持
### 版本1.1.1 - 21/01/2013
在调用require()的例子中使用了正确的名称来包含这个模块。
### 版本1.1.2 - 22/01/2013
实现子树()、表()和走()方法。
支持IPv6(为createSession()函数添加了传输选项)
重新编排README.md中的一些方法。
### 版本1.1.3 - 27/01/2013
修正README.md中的一些错别字和语法错误。
示例的snmp-table程序在使用信息中出现了snmp-subtree。
实现snmp-tail程序示例，不断轮询OIDs值
在README.md中添加关于通过返回true来停止walk()和subtree()方法的说明。
### 版本1.1.4 - 29/01/2013
修正README.md中 "NPM "一词的错误用法，应为 "npm"
### 版本1.1.5 - 05/02/2013
没有使用createSession()的传输选项。
### 版本1.1.6 - 12/04/2013
实现tableColumns()方法
添加了示例程序snmp-table-columns.js。
表参数在table()回调中的名称正确。
OID比较性能略有提高
### 版本1.1.7 - 11/05/2013
使用MIT许可证而不是GPL
### 版本1.1.8 - 22/06/2013
添加了示例程序cisco-device-inventory.js。
接收陷阱失败。TypeError: 当使用SNMP版本2c发送陷阱时，值超出了范围。
### 版本1.1.9 - 03/11/2013
纠正了README.md文件中一些方法中名为requestCallback的参数，这些参数应该是feedCallback。
Null类型用于值为0的varbinds。
在README.md文件中，将snmp.Type的实例更正为snmp.ObjectType。
### 版本1.1.10 - 01/12/2013
在发送()方法中的dgram.send()回调中的错误处理程序正在从错误参数中创建一个新的Error类实例，但它已经是Error类的一个实例了(感谢Ray Solomon)
在该模块导出的错误类中添加堆栈痕迹（感谢Ray Solomon）。
允许用户在创建会话时指定0次重试（感谢Ray Solomon）。
更新我们在 README.md 文件的标准符合性部分所遵守的 SNMP 版本 1 相关 RFC 的列表。
### 版本1.1.11 - 27/12/2013
在Session类的createSession()方法中增加sourceAddress和sourcePort可选选项，可以用来控制消息从哪个IP地址和端口发送。
允许用户为SNMP traps指定sysUpTime，并通知用户。
### 版本1.1.12 - 02/04/2014
当在选项对象中传递给trap()方法时，不会使用agentAddr属性。
### 版本1.1.13 - 12/08/2014
没有捕获从dgram.createSocket()函数返回的UDP套接字的错误事件。
一些请求方法没有复制参数，导致有时出现意外行为。
在一个SNMP会话中对所有请求使用一个UDP套接字。
在Session.send()方法的定时器回调中使用try/catch块。
会话现在可以发出一个错误事件来捕获会话底层UDP套接字中的错误。
会话现在可以发出一个关闭事件，以捕获来自会话底层UDP套接字的关闭事件，这将导致所有未完成的请求被取消。
在Session中添加了一个close()方法来关闭一个会话的底层UDP套接字，从而产生一个关闭事件。
在解析响应消息时，有符号的整数会被当作无符号的整数来处理
### 版本1.1.14 - 22/09/2015
GitHub上的主机仓库
### 版本1.1.15 - 08/02/2016
当解析无效响应时，消息解析中的异常不会中断响应处理。
在响应处理过程中处理错误时，在调用req.responseCb时错误地传递了req对象。
### 版本1.1.16 - 29/02/2016
解决用户在Mocha测试套件中发现的一些问题。
### 版本1.1.17 - 21/03/2016
在Session对象构造函数中正确引用了不存在的req变量（应该是this）。
### 版本1.1.18 - 15/05/2015
修正snmp.createSession()函数的参数号和名称。
为README.md文件中的一个例子添加缺失的括号。
### 版本1.1.19 - 26/08/2016
删除64位整数检查，以确保发送和接收的消息中最多包含8个字节。
### 版本1.2.0 - 22/07/2017
将asn1依赖性改为asn1-ber。
### 版本1.2.1 - 11/02/2018
增加对 16 位 id 的支持，以帮助与旧设备进行互操作（在 createSession() 函数中增加了 idBitsSize 选项。
在README.md中添加说明，即在使用完毕后应关闭会话。
### 版本1.2.3 - 06/06/2018
设置NoSpaceships Ltd为所有者和维护者。
### 版本1.2.4 - 07/06/2018
删除README.md中多余的部分。
### 版本2.0.0 - 16/01/2020
增加SNMPv3支持
### 版本2.1.0 - 16/01/2020
添加陷阱并通知接收方
### 版本2.1.1 - 17/01/2020
增加CONTRIBUTING.md准则。
### 版本2.1.2 - 17/01/2020
为Session类添加SNMPv3上下文
### 版本2.1.3 - 18/01/2020
增加IPv6测试选项
### 版本2.2.0 - 21/01/2020
添加SNMP代理
### 版本2.3.0 - 22/01/2020
增加MIB解析器和模块存储
### 版本2.4.0 - 24/01/2020
在代理中添加代理转发

## 许可证
Copyright (c) 2020 Mark Abrahams mark@abrahams.co.nz

Copyright (c) 2018 NoSpaceships Ltd hello@nospaceships.com

版权所有 (c) 2013 Stephen Vickers stephen.vickers.sv@gmail.com

兹免费授予任何获得本软件和相关文档文件（"软件"）副本的人不受限制地使用本软件的权利，包括但不限于使用、复制、修改、合并、出版、分发、再许可和/或出售本软件副本的权利，并允许接受本软件的人在以下条件下这样做。

上述版权声明和本许可声明应包含在本软件的所有副本或主要部分中。

本软件 "按原样 "提供，没有任何形式的明示或暗示的保证，包括但不限于适销性、特定用途的适用性和不侵权的保证。在任何情况下，作者或版权持有者均不对因本软件或本软件的使用或其他交易而引起的、因本软件的使用或与本软件有关的合同、侵权或其他行为的任何索赔、损害或其他责任负责。