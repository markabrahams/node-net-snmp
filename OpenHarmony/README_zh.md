# net-snmp

## 简介

net-snmp 是一个 实现了简单网络管理协议(SNMP)的1、2c和3的库。

## 下载安装

```shell
ohpm install @ohos/net-snmp
```

OpenHarmony ohpm环境配置等更多内容，请参考 [如何安装OpenHarmony har包](https://gitcode.com/openharmony-tpc/docs/blob/master/OpenHarmony_har_usage.md) 。

## 使用说明

1.简单使用
```
  let session :snmp.Session= snmp.createSession ("10.50.40.26", "public");
  let oids = ["1.3.6.1.2.1.1.5.0", "1.3.6.1.2.1.1.6.0"];
  session.get (oids,  (error:ESObject, letbinds:ESObject) =>{
    if (error) {
      console.error (error);
    } else {
      for (let i = 0; i < letbinds.length; i++)
        if (snmp.isletbindError (letbinds[i]))
          console.error ("SNMP-->"+snmp.letbindError (letbinds[i]))
        else
          console.info ("SNMP-->"+letbinds[i].oid + " = " + letbinds[i].value);
    }
    session.close ();
  });

  session.trap (snmp.TrapType.LinkDown,  (error:ESObject)=> {
    if (error)
      console.error (error);
  });
```

2.创建v3 Session会话
```
  let options = {
    port: 161,  //发送请求的UDP端口
    retries: 1, //重新发送请求的次数，默认为 "1"。
    timeout: 5000, //在重新尝试或失败之前等待响应的毫秒数，默认值为5000
    transport: "udp4", //指定要使用的传输，可以是udp4或udp6，默认为udp4。
    trapPort: 162, //发送陷阱和通知的UDP端口，默认值为162。
    version: snmp.Version3, //snmp.Version1或snmp.Version2c，默认为snmp.Version1
    idBitsSize: 32,//16或32，默认为32。用来减少生成的id的大小，以便与一些旧设备兼容。
  };

  let user = {
    name: "blinkybill",
    level: snmp.SecurityLevel.authPriv,
    authProtocol: snmp.AuthProtocols.sha,//鉴权方式
    authKey: "madeahash",
    privProtocol: snmp.PrivProtocols.des,//用于DES加密
    privKey: "privycouncil"
  };

  let session = snmp.createV3Session ("127.0.0.1", user, options);
```

3.事件注册
```
let session = snmp.createV3Session ("127.0.0.1", user, options); 
//当会话的底层UDP套接字被关闭时，会话会发出 "close "事件。
session.on ("close", function () {
    console.log ("socket closed");
}); 
//当会话的底层UDP套接字发出错误时，会话会发出 "error "事件。
session.on ("error", function (error) {
    console.log (error.toString ());
    session.close ();
}); 
```

4.关闭会话
```
let session = snmp.createV3Session ("127.0.0.1", user, options); 
//close()方法关闭UDP套接字的底层会话。这将导致会话底层UDP套接字发出 "close "事件，并传递给会话，导致会话也发出 "close "事件。
session.close (); 
```

5.获取一个或多个OID的值。
```
let oids = ["1.3.6.1.2.1.1.5.0", "1.3.6.1.2.1.1.6.0"];

session.get (oids, function (error, letbinds) {
    if (error) {
        console.error (error.toString ());
    } else {
        for (let i = 0; i < letbinds.length; i++) {
            // for version 1 we can assume all OIDs were successful
            console.log (letbinds[i].oid + "|" + letbinds[i].value);
        
            // for version 2c we must check each OID for an error condition
            if (snmp.isletbindError (letbinds[i]))
                console.error (snmp.letbindError (letbinds[i]));
            else
                console.log (letbinds[i].oid + "|" + letbinds[i].value);
        }
    }
}); 
```

6.获取MIB树中一个或多个OID后按词法排列的OID的值(方式一)
```
let oids = [
    "1.3.6.1.2.1.1.4.0",
    "1.3.6.1.2.1.1.5.0",
    "1.3.6.1.2.1.2.2.1.2",
    "1.3.6.1.2.1.2.2.1.3"
];
 
let nonRepeaters = 2;
 
session.getBulk (oids, nonRepeaters, function (error, letbinds) {
    if (error) {
        console.error (error.toString ());
    } else {
        // step through the non-repeaters which are single letbinds
        for (let i = 0; i < nonRepeaters; i++) {
            if (i >= letbinds.length)
                break;
 
            if (snmp.isletbindError (letbinds[i]))
                console.error (snmp.letbindError (letbinds[i]));
            else
                console.log (letbinds[i].oid + "|" + letbinds[i].value);
        }
 
        // then step through the repeaters which are letbind arrays
        for (let i = nonRepeaters; i < letbinds.length; i++) {
            for (let j = 0; j < letbinds[i].length; j++) {
                if (snmp.isletbindError (letbinds[i][j]))
                    console.error (snmp.letbindError (letbinds[i][j]));
                else
                    console.log (letbinds[i][j].oid + "|"
                            + letbinds[i][j].value);
            }
        }
    }
});
```

7.获取MIB树中一个或多个OID后按词法排列的OID的值(方式二)
```
let oids = [
    "1.3.6.1.2.1.1.1.0",
    "1.3.6.1.2.1.1.4.0"
];

session.getNext (oids, function (error, letbinds) {
    if (error) {
        console.error (error.toString ());
    } else {
        for (let i = 0; i < letbinds.length; i++) {
            // for version 1 we can assume all OIDs were successful
            console.log (letbinds[i].oid + "|" + letbinds[i].value);
        
            // for version 2c we must check each OID for an error condition
            if (snmp.isletbindError (letbinds[i]))
                console.error (snmp.letbindError (letbinds[i]));
            else
                console.log (letbinds[i].oid + "|" + letbinds[i].value);
        }
    }
}); 
```


8.获取MIB树中以指定的OID为基础，按词法排列在指定OID之后的所有OID的值
```
let oid = "1.3.6.1.2.1.2.2";

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
        let indexes = [];
        for (index in table)
            indexes.push (parseInt (index));
        indexes.sort (sortInt);
        
        // Use the sorted indexes we've calculated to walk through each
        // row in order
        for (let i = 0; i < indexes.length; i++) {
            // Like indexes we sort by column, so use the same trick here,
            // some rows may not have the same columns as other rows, so
            // we calculate this per row
            let columns = [];
            for (column in table[indexes[i]])
                columns.push (parseInt (column));
            columns.sort (sortInt);
            
            // Print index, then each column indented under the index
            console.log ("row for index = " + indexes[i]);
            for (let j = 0; j < columns.length; j++) {
                console.log ("   column " + columns[j] + " = "
                        + table[indexes[i]][columns[j]]);
            }
        }
    }
}

let maxRepetitions = 20;

// The maxRepetitions argument is optional, and will be ignored unless using
// SNMP verison 2c
session.table (oid, maxRepetitions, responseCb); 
```

9.tableColumns()方法实现了与table()方法相同的接口,但是，只有在columns参数中指定的列才会出现在生成的表中。 当只需要选定的列时，应该使用这个方法，并且会比table()方法快很多倍，因为会这会减少提取的数据量。
```
let oid = "1.3.6.1.2.1.2.2";
let columns = [2, 6];

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
        let indexes = [];
        for (index in table)
            indexes.push (parseInt (index));
        indexes.sort (sortInt);
        
        // Use the sorted indexes we've calculated to walk through each
        // row in order
        for (let i = 0; i < indexes.length; i++) {
            // Like indexes we sort by column, so use the same trick here,
            // some rows may not have the same columns as other rows, so
            // we calculate this per row
            let columns = [];
            for (column in table[indexes[i]])
                columns.push (parseInt (column));
            columns.sort (sortInt);
            
            // Print index, then each column indented under the index
            console.log ("row for index = " + indexes[i]);
            for (let j = 0; j < columns.length; j++) {
                console.log ("   column " + columns[j] + " = "
                        + table[indexes[i]][columns[j]]);
            }
        }
    }
}

let maxRepetitions = 20;

// The maxRepetitions argument is optional, and will be ignored unless using
// SNMP verison 2c
session.tableColumns (oid, columns, maxRepetitions, responseCb); 
```

10.发送一个SNMP,trap.typeOrOid参数可以是两种类型之一
```
let trapOid = "1.3.6.1.4.1.2000.1";

let letbinds = [
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
session.trap (trapOid, letbinds, function (error) {
    if (error)
        console.error (error);
}); 
```

11.获取MIB树中指定的OID之后所有OID的词法值
```
let oid = "1.3.6.1.2.1.2.2";

function doneCb (error) {
    if (error)
        console.error (error.toString ());
}

function feedCb (letbinds) {
    for (let i = 0; i < letbinds.length; i++) {
        if (snmp.isletbindError (letbinds[i]))
            console.error (snmp.letbindError (letbinds[i]));
        else
            console.log (letbinds[i].oid + "|" + letbinds[i].value);
    }
}

let maxRepetitions = 20;

// The maxRepetitions argument is optional, and will be ignored unless using
// SNMP verison 2c
session.walk (oid, maxRepetitions, feedCb, doneCb
```

12.例化并返回一个Receiver类的实例
```
// Default options
let options = {
    port: 162,
    disableAuthorization: false,
    accessControlModelType: snmp.AccessControlModelType.None,
    engineID: "8000B98380XXXXXXXXXXXX", // where the X's are random hex digits
    address: null
    transport: "udp4"
};

let callback = function (error, notification) {
    if ( error ) {
        console.error (error);
    } else {
        console.log (JSON.stringify(notification, null, 2));
    }
};

receiver = snmp.createReceiver (options, callback); 

//返回接收器的Authorizer实例，用于控制对接收器的访问
let authorizer=receiver.getAuthorizer ()

在接收者的社区授权列表中添加一个社区字符串。如果社区已经在列表中，则不做任何操作，确保列表中任何给定的社区字符串只出现一次。
authorizer.addCommunity (community)

如果接收者的社区授权列表中存储了一个社区字符串，则返回该字符串，否则返回null。
authorizer.getCommunity (community)

返回接收者的社区授权列表。
authorizer.getCommunities ()

从接收者的社区授权列表中删除一个社区字符串。如果社区不在列表中，则不做任何操作。
authorizer.deleteCommunity (community)

在接收方的用户授权列表中添加一个用户
authorizer.addUser (user)

如果接收者的用户授权列表中存储了一个使用所提供名字的用户，则返回一个用户对象，否则返回null。
authorizer.getUser (userName)

返回接收方的用户授权列表。
authorizer.getUsers ()

从接收方的用户授权列表中删除一个用户。如果提供的用户名称不在列表中，则不做任何操作。
authorizer.deleteUser (userName)

返回该授权器的snmp.AccessControlModelType。
authorizer.getAccessControlModelType ()

返回访问控制模型对象。
authorizer.getAccessControlModel ()

receiver.close () //关闭接收机的监听插座，结束接收机的操作。
```

13.实例化并返回一个Agent类的实例
```
let options = {
    port: 161,
    disableAuthorization: false,
    accessControlModelType: snmp.AccessControlModelType.None,
    engineID: "8000B98380XXXXXXXXXXXX", // where the X's are random hex digits
    address: null
    transport: "udp4"
};

let callback = function (error, data) {
    if ( error ) {
        console.error (error);
    } else {
        console.log (JSON.stringify(data, null, 2));
    }
};

agent = snmp.createAgent (options, callback)

//返回代理的单人Authorizer实例，用于控制对代理的访问。更多细节请参见 "Authorizer "部分。
agent.getAuthorizer ()

//返回Mib单例。
agent.getMib ()

//将代理的单Mib实例设置为提供的实例。代理商放弃其现有的Mib实例。
agent.setMib (mib)

//返回代理的单 "Forwarder "实例，该实例持有注册的代理列表，该代理指定基于上下文转发到远程主机。
agent.getForwarder ()

//关闭代理的监听套接字，结束代理的操作。
agent.close ()
```

14.SimpleAccessControlModel(访问控制模型)
```
let agent = snmp.createAgent({
    accessControlModelType: snmp.AccessControlModelType.Simple
}, function (error, data) {
    // null callback for example brevity
});
let authorizer = agent.getAuthorizer ();
authorizer.addCommunity ("public");
authorizer.addCommunity ("private");
authorizer.addUser ({
    name: "fred",
    level: snmp.SecurityLevel.noAuthNoPriv
});
let acm = authorizer.getAccessControlModel ();
acm.setCommunityAccess ("public", snmp.AccessLevel.ReadOnly);
acm.setCommunityAccess ("private", snmp.AccessLevel.ReadWrite);
acm.setUserAccess ("fred", snmp.AccessLevel.ReadWrite); 

删除指定社区的所有访问。
simpleAccessControlModel.removeCommunityAccess (community)

返回指定社区的访问级别。
simpleAccessControlModel.getCommunityAccessLevel (community)

返回该访问控制模型定义的所有社区访问控制条目的列表。
simpleAccessControlModel.getCommunitiesAccess ()

给予用户指定的访问级别。
simpleAccessControlModel.setUserAccess (userName, accessLevel)

删除指定用户的所有访问权限。
simpleAccessControlModel.removeUserAccess (userName)

返回指定用户的访问级别。
simpleAccessControlModel.getUserAccessLevel (userName)

返回该访问控制模型定义的所有用户访问控制项的列表
simpleAccessControlModel.getUsersAccess ()

```

15.Mib
```
let myTableProvider = {
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
let mib = agent.getMib ();
mib.registerProvider (myTableProvider);//在MIB中注册一个提供者定义。不向MIB树添加任何内容。
mib.unregisterProvider (name);//从MIB中取消注册一个提供者。
mib.addTableRow ("smallIfTable", [1, "eth0", 6]); 

返回在MIB中注册的提供者定义的对象，按提供者名称索引。
mib.getProviders ()

返回给定名称的单个注册提供者对象。
mib.getProvider (name)

从一个标量提供者那里检索值。
mib.getScalarValue (scalarProviderName)

设置标量提供者的值。如果这是该提供者向MIB注册后第一次设置标量，那么它还会将实例（".0"）节点和所有所需的祖先添加到MIB树中。
mib.setScalarValue (scalarProviderName, value)

将表行--以值数组的形式--添加到表提供者。如果表是空的，则在添加值行之前，实例化提供者的oid节点和祖先，即其列。请注意，该行是一个按照表列顺序排列的元素数组。如果表有任何外来索引列（即那些不属于本表的索引列），那么这些列的值必须按照它们在MIB INDEX子句中出现的顺序，包含在行数组的开头。
mib.addTableRow (tableProviderName, row)

返回提供者的列定义对象列表。
mib.getTableColumnDefinitions (tableProviderName)

返回表格数据的二维数组。如果byRow为false(默认)，那么表格数据是以列数组列表的形式给出的，即按列给出。如果byRow是true，那么数据就是一个行数组的列表。如果includeInstances是true，那么，对于列视图，将有一个额外的第一列的实例索引信息。如果行视图中includeInstances为true，那么在每一行的开始会有一个附加元素，包含索引信息。
mib.getTableCells (tableProviderName, byRow, includeInstances)

返回给定列号的单列表数据。如果 "includeInstances "为 "true"，则返回两个数组：第一个数组包含实例索引信息，第二个数组包含列数据。
mib.getTableColumnCells (tableProviderName, columnNumber, includeInstances)

返回给定行索引的单行表数据。行索引是一个由索引值组成的数组，从紧挨着列下的节点到行实例末尾的节点，这将是MIB树中的一个叶子节点。最终，非整数值需要转换为整数序列，构成OID的实例部分。下面是将索引值转换为行实例OID序列的细节。
mib.getTableRowCells (tableProviderName, rowIndex)

返回指定列和行的单个单元格值。行索引数组的指定方式与getTableRowCells()调用相同。
mib.getTableSingleCell (tableProviderName, columnIndex, rowIndex)

在指定的列和行设置一个单元格值。行索引数组的指定方式与getTableRowCells()调用相同。
mib.setTableSingleCell (tableProviderName, columnIndex, rowIndex, value)

在指定的行索引处删除表的一行。行索引数组的指定方式与getTableRowCells()调用相同。如果这是表的最后一行，表就会从MIB中被修剪掉，尽管提供者仍然在MIB中注册。这意味着，在增加另一行时，该表将被再次实例化。
mib.deleteTableRow (tableProviderName, rowIndex)

以文本格式转储MIB
mib.dump (options)
```

16.ModuleStore(该实例预装了一些 "基础 "MIB模块，这些模块提供了其他MIB模块常用的MIB定义（"导入"）)
```
将给定文件中的所有MIB模块加载到模块存储中。按照惯例，每个文件中通常只有一个MIB模块，但一个文件中可以存储多个模块定义。然后，加载的MIB模块被这个API用它们的MIB模块名而不是源文件名来引用。MIB模块名是MIB文件中DEFINITIONS ::= BEGIN前面的名称，通常是MIB文件中最先出现的东西。
请注意，如果您的MIB依赖于（"导入"）其他MIB文件中的定义，则必须首先加载这些定义，例如，流行的IF-MIB使用了来自IANAifType-MIB的定义，因此必须首先加载。这些依赖关系列在MIB模块的IMPORTS部分，通常在MIB文件的顶部。预先加载的 "基础 "MIB模块包含了许多常用的导入。
lstore.loadFromFile (fileName)

以JSON对象的形式从存储中检索命名的MIB模块。
store.getModule (moduleName)

从store中检索所有的MIB模块，如果 "includeBase "布尔值被设置为true，那么基本的MIB模块就被包含在列表中。模块作为一个单一的JSON 对象的形式返回，以模块名称为键，其值是整个JSON模块的表示。
store.getModules (includeBase)

检索商店中加载的所有MIB模块名称的列表。如果 "includeBase "布尔值被设置为true，那么MIB模块的基本名称就会被包含在列表中。
store.getModuleNames (includeBase)

返回一个Mib"提供者 "定义的数组，该数组对应于命名的MIB模块中包含的所有标量和表实例对象。然后，通过使用agent.getMib().registerProviders()调用，提供者定义列表就可以被注册到代理的MIB中。
store.getProvidersForModule (moduleName)
```

17.Forwarder
```

//Forwarder只支持SNMPv3会话的代理
let forwarder = agent.getForwarder ();
为转发者添加一个新的代理。代理是一个包含以下字段的对象。
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

从转发者中删除给定上下文的代理。
forwarder.deleteProxy (context)

返回给定上下文的转发者的代理。
forwarder.getProxy (context)

返回一个包含所有注册代理的列表的对象，按上下文名称键入。
forwarder.getProxies ()

打印所有代理定义的转储到控制台。
forwarder.dumpProxies ()
```

18.Subagent
```
// Default options
var options = {
    master: localhost
    masterPort: 705,
    timeout: 0,
    description: "Node net-snmp AgentX sub-agent",
};

subagent = snmp.createSubagent (options); 
返回代理的单Mib实例。 在创建子代理时自动创建，并保存子代理的所有管理数据。
subagent.getMib ()

关于提供者的定义，请参见Mib类registerProvider()调用。对于这个调用，provider对象的格式和意义是一样的。这将向主站发送一个RegisterPDU来注册MIB的一个区域，主站将为这个区域向子代理发送 "请求处理 "PDU。所提供的 "回调 "只使用一次，在接收到主站对 "Register "PDU的后续 "Response "PDU时使用。这不能与提供者定义中的可选回调 "handler "相混淆，后者对子代理收到的任何 "请求处理 "PDU都会被调用，用于注册MIB区域中的MIB对象。
subagent.registerProvider (provider, callback)

通过提供的提供者的名称来解除对以前注册的MIB区域的注册。向主代理发送一个 "解除注册 "PDU来完成这项工作。所提供的 "回调 "只使用一次，在收到主代理的后续 "响应 "PDU时才会使用 "Unregister "PDU。
subagent.unregisterProvider (name, callback)

返回在MIB中注册的提供者定义的对象，按提供者名称索引。
subagent.getProviders ()

Returns a single registered provider object for the given name.
subagent.getProvider (name)

将一个由oid和descr组成的代理能力添加到主代理的sysORTable中。向主代理发送一个 "AddAgentCaps "PDU来完成这项工作。当收到主代理发送的后续 "Response "PDU到 "AddAgentCaps "PDU时，会调用所提供的 "callback"。
subagent.addAgentCaps (oid, descr, callback)

从主代理的sysORTable中删除之前添加的能力。向主代理发送一个 "RemoveAgentCaps "PDU来完成这个操作。当收到主代理发送的后续 "Response "PDU到 "RemoveAgentCaps "PDU时，会调用提供的 "callback"。
subagent.removeAgentCaps (oid, callback)

```

## 接口说明

### snmp

| 接口名                      | 参数                         | 返回值             | 说明                                    |
|--------------------------|----------------------------| --------------- |---------------------------------------|
| createSession                   | target, community, options | Session | 创建v1 和 v2c 会话                         |
| createV3Session              | target, user, options      | Session | 创建v3 会话                               |
| createReceiver           | options, callback          | Receiver | 实例化并返回一个Receiver类的实例                               |
| createAgent              | options, callback, mib     | Agent | 实例化并返回一个Agent类的实例                               |
| createModuleStore              | resManager                 | ModuleStore | 创建一个新的ModuleStore实例，该实例预装了一些 "基础 "MIB模块                               |
| createSubagent              | options                    | Subagent  | 实例化并返回一个Subagent                           |
| createMib              | 无                          | Mib | 实例化并返回一个Mib类的实例                               |

### Session

| 接口名      | 参数                    | 返回值             | 说明      |
|----------|-----------------------| --------------- |---------|
| close    | 无                     | Session | 关闭会话    |
| get      | oids, callback | Session | 获取一个或多个OID的值 |
| getBulk  | oids, [nonRepeaters], [maxRepetitions], callback | Session | 获取MIB树中一个或多个OID后按词法排列的OID的值 |
| getNext  | oids, callback | Session | 获取MIB树中一个或多个OID后按词法排列的OID的值 |
| subtree  | oid, [maxRepetitions], feedCallback, doneCallback | Session | 获取MIB树中以指定的OID为基础，按词法排列在指定OID之后的所有OID的值 |
| table    | oid, [maxRepetitions], callback | Session | 获取MIB树中以指定的OID为基础的、按词法排列在指定OID之后的所有OID的值 |
| tableColumns | oid, columns, [maxRepetitions], callback | Session | 获取MIB树中以指定的OID为基础的、按词法排列在指定OID之后的所有OID的值 |
| trap     | typeOrOid, [varbinds], [agentAddrOrOptions], callback | Session | 发送一个SNMP |
| walk     | oid, [maxRepetitions], feedCallback, doneCallback | Session | 获取MIB树中指定的OID之后所有OID的词法值 |

### Receiver

| 接口名      | 参数                    | 返回值             | 说明      |
|----------|-----------------------| --------------- |---------|
| getAuthorizer     | 无      | Authorizer | 回接收器的Authorizer实例，用于控制对接收器的访问。    |
| close       |无 | 无   | 关闭接收机的监听插座，结束接收机的操作 |

### Agent

| 接口名      | 参数                    | 返回值             | 说明      |
|----------|-----------------------| --------------- |---------|
| getAuthorizer   | 无      | Authorizer | 返回代理的单人Authorizer实例，用于控制对代理的访问    |
| getMib       |无 | Mib   | 返回Mib单例 |
| setMib        |mib | 无   | 将代理的单Mib实例设置为提供的实例。代理商放弃其现有的Mib实例 |
| getForwarder        |无 | Forwarder   | 返回代理的单 "Forwarder "实例，该实例持有注册的代理列表，该代理指定基于上下文转发到远程主机。 |
| close        |无 | 无   |关闭代理的监听套接字，结束代理的操作 |

### Authorizer

| 接口名      | 参数        | 返回值    | 说明                                                                    |
|----------|-----------|--------|-----------------------------------------------------------------------|
| addCommunity  | community | void   | 在接收者的社区授权列表中添加一个社区字符串                                                 |
| getCommunity  | community | any    | 如果接收者的社区授权列表中存储了一个社区字符串，则返回 "null"，否则返回 "null"                        |
| getCommunities | 无         | [any]  | 返回接收者的社区授权列表。                                                         |
| deleteCommunity | community | void   | 从接收者的社区授权列表中删除一个社区字符串。如果社区不在列表中，则不做任何操作                               |
| addUser       | user      | 无      | 在接收方的用户授权列表中添加一个用户。如果列表中存在同名用户,则该调用将删除现有用户，并以提供的用户取而代之，确保列表中只存在一个同名用户 |
| getUser       | userName      | any    | 如果接收者的用户授权列表中存储了一个使用所提供名字的用户，则返回一个用户对象，否则返回null。                      |
| getUsers       | user      | [any]  | 返回接收方的用户授权列表                                                          |
| deleteUser     | userName      | 无      | 从接收方的用户授权列表中删除一个用户。如果提供的用户名称不在列表中，则不做任何操作。                            |
| getAccessControlModelType | 无         | number | 返回该授权器的snmp.AccessControlModelType。                                   |
| getAccessControlModel  | 无        | 无      | 返回访问控制模型对象。                                                           |

### SimpleAccessControlModel

| 接口名      | 参数                   | 返回值    | 说明                                                                    |
|----------|----------------------|--------|-----------------------------------------------------------------------|
| setCommunityAccess | community, accessLevel    | void   | 授予给定的社区给定的访问级别           |
| removeCommunityAccess | community            | void   | 删除指定社区的所有访问。     |
| getCommunityAccessLevel | community    | number | 返回指定社区的访问级别。                                                         |
| getCommunitiesAccess | 无                    | number | 返回该访问控制模型定义的所有社区访问控制条目的列表       |
| setUserAccess     | userName, accessLevel | 无      | 给予用户指定的访问级别。 |
| removeUserAccess | userName             | void   | 删除指定用户的所有访问权限。                                                   |
| getUserAccessLevel | userName             | number | 返回指定用户的访问级别                                                    |
| getUsersAccess | userName             | 无      | 返回该访问控制模型定义的所有用户访问控制项的列表。         | |

### MIB

| 接口名    | 参数                    | 返回值    | 说明                                                                    |
|--------|-----------------------|--------|-----------------------------------------------------------------------|
| registerProvider | definition            | void   | 在MIB中注册一个提供者定义。不向MIB树添加任何内容           |
| registerProviders | [definitions]         | void   | 一次调用注册提供者数组的方便方法。     |
| unregisterProvider | name             | void   | 从MIB中取消注册一个提供者。                                                         |
| getProviders | 无                     | [any]  | 返回在MIB中注册的提供者定义的对象，按提供者名称索引      |
| getProvider  | name | any    | 返回给定名称的单个注册提供者对象。 |
| getScalarValue  | scalarProviderName              | any    | 从一个标量提供者那里检索值。                                                   |
| setScalarValue  | scalarProviderName, value              | number | 设置标量提供者的值                                                    |
| addTableRow  | tableProviderName, row              | 无      | 将表行--以值数组的形式--添加到表提供者。         | |
| getTableColumnDefinitions | tableProviderName              | any    | 返回提供者的列定义对象列表。         | |
| getTableCells | tableProviderName, byRow, includeInstances              | any    | 返回表格数据的二维数组。         | |
| getTableColumnCells | tableProviderName, columnNumber, includeInstances              | any    | 返回给定列号的单列表数据。         | |
| getTableRowCells | tableProviderName, rowIndex              | any    | 返回给定行索引的单行表数据。         | |
| getTableSingleCell | tableProviderName, columnIndex, rowIndex              | any    | 返回指定列和行的单个单元格值。         | |
| setTableSingleCell | tableProviderName, columnIndex, rowIndex, value              | 无      | 在指定的列和行设置一个单元格值。         | |
| deleteTableRow| tableProviderName, rowIndex              | 无      | 在指定的行索引处删除表的一行。行索引数组的指定方式与getTableRowCells()调用相同。         | |
| dump  | options              | 无      | 以文本格式转储MIB         |

### ModuleStore

| 接口名    | 参数          | 返回值  | 说明                                                                    |
|--------|-------------|------|-----------------------------------------------------------------------|
| loadFromFile | fileName ,resManager | void | 将给定文件中的所有MIB模块加载到模块存储中           |
| getModule  | moduleName  | any  | 以JSON对象的形式从存储中检索命名的MIB模块。     |
| getModules  | includeBase | any  | 从store中检索所有的MIB模块。                                                         |
| getModuleNames  | includeBase | any  | 检索商店中加载的所有MIB模块名称的列表     |
| getProvidersForModule  | moduleName  | any  | 返回一个Mib"提供者 "定义的数组。 |

### Forwarder

| 接口名    | 参数          | 返回值  | 说明                                                                   |
|--------|-------------|------|----------------------------------------------------------------------|
| addProxy  | proxy    | void | 为转发者添加一个新的代理         |
| deleteProxy | context  | void | 从转发者中删除给定上下文的代理。     |
| getProxy  | context | any  | 返回给定上下文的转发者的代理。                                                        |
| getProxies | 无           | any  | 返回一个包含所有注册代理的列表的对象，按上下文名称键入    |
| dumpProxies | 无           | void | 打印所有代理定义的转储到控制台。 |

### Subagent

| 接口名   | 参数                            | 返回值  | 说明                                                                   |
|-------|-------------------------------|------|----------------------------------------------------------------------|
| getMib | 无                             | Mib  | 返回代理的单Mib实例         | |
| registerProvider | provider, callback            | any  | 关于提供者的定义，请参见Mib类registerProvider()调用    |
| registerProviders | [definitions], callback           | void | 一次调用注册提供者数组的方便方法。 |
| unregisterProvider | name, callback                | void | 通过提供的提供者的名称来解除对以前注册的MIB区域的注册 |
| getProviders | 无                             | any  | 返回在MIB中注册的提供者定义的对象，按提供者名称索引。 |
| getProvider | name                          | any  | 返回给定名称的单个已注册提供程序对象。 |
| addAgentCaps | oid, descr, callback          | void | 将一个由oid和descr组成的代理能力添加到主代理的sysORTable中。 |
| removeAgentCaps | oid, callback                 | void | 从主代理的sysORTable中删除之前添加的能力。 |

## 关于混淆
- 代码混淆，请查看[代码混淆简介](https://docs.openharmony.cn/pages/v5.0/zh-cn/application-dev/arkts-utils/source-obfuscation.md)
- 如果希望net-snmp库在代码混淆过程中不会被混淆，需要在混淆规则配置文件obfuscation-rules.txt中添加相应的排除规则：

```
-keep
./oh_modules/@ohos/net-snmp
```

## 约束与限制

- DevEco Studio 版本： 5.0.3.300SP2  OpenHarmony SDK:API12 (5.0.0.22)

## 目录结构

````
|---- net_snmp
|     |---- entry  # 示例代码文件夹
|     |---- snmp  # fastble库文件夹
|	    |----src
          |----main
              |----ets
                  |----mib.js #MIB树状结构，保存着管理信息
                  |----dgram.ts #udp通信
|           |---- index.js  # 核心功能
|     |---- README.md  # 安装使用方法                    
````

## 贡献代码

使用过程中发现任何问题都可以提 [Issue](https://gitcode.com/openharmony-tpc/openharmony_tpc_samples/issues) 给组件，当然，也非常欢迎给发[PR](https://gitcode.com/openharmony-tpc/openharmony_tpc_samples/pulls)共建 。


## 开源协议

本项目基于 [MIT LICENSE](https://gitcode.com/openharmony-tpc/openharmony_tpc_samples/net_snmp/blob/master/LICENSE) ，请自由地享受和参与开源。
