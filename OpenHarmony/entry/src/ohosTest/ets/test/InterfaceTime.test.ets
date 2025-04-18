/*
 * (The MIT License)

 * Copyright (c) 2023 Huawei Device Co., Ltd.

 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * 'Software'), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:

 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import { describe, expect, it, TestType } from '@ohos/hypium';
import * as snmp from '@ohos/net-snmp';

export default function InterfaceTime() {
  let serverAddress = "192.168.0.2"
  describe('interfaceTime', () => {
    const BASE_COUNT = 100
    const BASELINE_CREATEHTTP = 10000

    it('get', TestType.PERFORMANCE, async (done: Function) => {
      let startTime = new Date().getTime()

      let session: snmp.Session = snmp.createSession(serverAddress, "public");
      let oids = ["1.3.6.1.2.1.1.5.0", "1.3.6.1.2.1.1.6.0"];
      for (let index = 0; index < BASE_COUNT; index++) {
        session.get(oids, (error: ESObject, varbinds: ESObject) => {
          if (error) {
            session.close();
            expect().assertFail()
          } else {
            session.close();
          }
        });
      }
      let endTime = new Date().getTime()
      console.log("Session.get endTime:" + endTime);
      let averageTime = ((endTime - startTime) * 1000) / BASE_COUNT
      console.log("Session.get averageTime:" + averageTime + "μs");
      expect(averageTime < BASELINE_CREATEHTTP).assertTrue();
      done()
    })

    it('getBulk', TestType.PERFORMANCE, async (done: Function) => {
      let startTime = new Date().getTime()

      let oids = [
        "1.3.6.1.2.1.1.4.0",
        "1.3.6.1.2.1.1.5.0",
        "1.3.6.1.2.1.2.2.1.2",
        "1.3.6.1.2.1.2.2.1.3"
      ];

      let nonRepeaters = 2;
      let session: snmp.Session = snmp.createSession(serverAddress, "public");

      for (let index = 0; index < BASE_COUNT; index++) {
        session.getBulk(oids, nonRepeaters, (error: ESObject, varbinds: ESObject) => {
          if (error) {
            session.close()
          } else {
            session.close();
          }
        });
      }
      let endTime = new Date().getTime()
      console.log("Session getBulk endTime:" + endTime);
      let averageTime = ((endTime - startTime) * 1000) / BASE_COUNT
      console.log("Session getBulk averageTime:" + averageTime + "μs");
      expect(averageTime < BASELINE_CREATEHTTP).assertTrue();
      done()
    })

    it('getNext', TestType.PERFORMANCE, async (done: Function) => {
      let startTime = new Date().getTime()
      let oids = [
        "1.3.6.1.2.1.1.1.0",
        "1.3.6.1.2.1.1.4.0"
      ];
      let session: snmp.Session = snmp.createSession("192.168.0.2", "public");
      for (let index = 0; index < BASE_COUNT; index++) {
        session.getNext(oids, (error: ESObject, varbinds: ESObject) => {
          if (error) {
            expect(false).assertTrue();
          } else {
            session.close();
          }
        });
      }
      let endTime = new Date().getTime()
      console.log("Session.getNext endTime:" + endTime);
      let averageTime = ((endTime - startTime) * 1000) / BASE_COUNT
      console.log("Session.getNext averageTime:" + averageTime + "μs");
      expect(averageTime < BASELINE_CREATEHTTP).assertTrue();
      done()
    })

    it('subtree', TestType.PERFORMANCE, async (done: Function) => {
      let startTime = new Date().getTime()

      let oid = "1.3.6.1.2.1.1";
      let maxRepetitions = 20;
      let session: snmp.Session = snmp.createSession("192.168.0.2", "public");

      for (let index = 0; index < BASE_COUNT; index++) {
        session.subtree(oid, maxRepetitions, (varbinds: ESObject) => {
          session.close();
        }, (error: ESObject) => {
          session.close();
        });
      }
      let endTime = new Date().getTime()
      console.log("Session.subtree endTime:" + endTime);
      let averageTime = ((endTime - startTime) * 1000) / BASE_COUNT
      console.log("Session.subtree  averageTime:" + averageTime + "μs");
      expect(averageTime < BASELINE_CREATEHTTP).assertTrue();
      done()
    })

    it('table', TestType.PERFORMANCE, async (done: Function) => {
      let startTime = new Date().getTime()

      let oid = "1.3.6.1.2.1.2.2";
      let session: snmp.Session = snmp.createSession("192.168.0.2", "public");
      let maxRepetitions = 20;


      for (let index = 0; index < BASE_COUNT; index++) {
        session.table(oid, maxRepetitions, (error: ESObject, table: ESObject) => {
          if (error) {
            session.close();
          } else {
            session.close();
          }
        });
      }
      let endTime = new Date().getTime()
      console.log("Session.table endTime:" + endTime);
      let averageTime = ((endTime - startTime) * 1000) / BASE_COUNT
      console.log("Session.table  averageTime:" + averageTime + "μs");
      expect(averageTime < BASELINE_CREATEHTTP).assertTrue();
      done()
    })

    it('tableColumns', TestType.PERFORMANCE, async (done: Function) => {
      let startTime = new Date().getTime()

      let oid = "1.3.6.1.2.1.2.2";
      let columns = [2, 6];
      let session: snmp.Session = snmp.createSession("192.168.0.2", "public");

      for (let index = 0; index < BASE_COUNT; index++) {
        session.tableColumns(oid, columns, 20, (error: ESObject, table: ESObject) => {
          if (error) {
            session.close();
          } else {
            session.close();
          }
        });
      }
      let endTime = new Date().getTime()
      console.log("Session.tableColumns endTime:" + endTime);
      let averageTime = ((endTime - startTime) * 1000) / BASE_COUNT
      console.log("Session.tableColumns  averageTime:" + averageTime + "μs");
      expect(averageTime < BASELINE_CREATEHTTP).assertTrue();
      done()
    })

    it('trap', TestType.PERFORMANCE, async (done: Function) => {
      let startTime = new Date().getTime()

      let trapOid = "1.3.6.1.4.1.2000.1";
      let session: snmp.Session = snmp.createSession(serverAddress, "public");

      for (let index = 0; index < BASE_COUNT; index++) {
        session.trap(trapOid, [
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
        ], (error: ESObject) => {
          if (error) {
            session.close();
          } else {
            session.close();
          }
        });
      }
      let endTime = new Date().getTime()
      console.log("Session.trap endTime:" + endTime);
      let averageTime = ((endTime - startTime) * 1000) / BASE_COUNT
      console.log("Session.trap  averageTime:" + averageTime + "μs");
      expect(averageTime < BASELINE_CREATEHTTP).assertTrue();
      done()
    })

    it('walk', TestType.PERFORMANCE, async (done: Function) => {
      let startTime = new Date().getTime()

      let oid = "1.3.6.1.2.1.1.5.0";
      let session: snmp.Session = snmp.createSession(serverAddress, "public");

      for (let index = 0; index < BASE_COUNT; index++) {
        session.walk(oid, 20, (varbinds: ESObject) => {
          session.close();
        }, (error: ESObject) => {
          if (error) {
            session.close();
          }
        });
      }
      let endTime = new Date().getTime()
      console.log("Session.walk endTime:" + endTime);
      let averageTime = ((endTime - startTime) * 1000) / BASE_COUNT
      console.log("Session.walk  averageTime:" + averageTime + "μs");
      expect(averageTime < BASELINE_CREATEHTTP).assertTrue();
      done()
    })

    it('mib', TestType.PERFORMANCE, async (done: Function) => {
      let startTime = new Date().getTime()

      let resManager: ESObject = snmp.GlobalContext.getContext().getValue("resourceManager")
      let store: ESObject = snmp.createModuleStore(resManager);

      let agent: ESObject = snmp.createAgent({
        disableAuthorization: false,
        port: 1026,
        engineID: "8000B98380XXXXXXXXXXXX",
        address: '192.168.0.3',
        transport: "udp4"
      });
      store.loadFromFile("IF-MIB.mib", resManager);
      store.loadFromFile("IANAifType-MIB.mib", resManager);
      for (let index = 0; index < BASE_COUNT; index++) {
        let mib: ESObject = agent.getMib();
        agent.setMib(mib)
        mib == agent.getMib();
        let authorizer: ESObject = agent.getAuthorizer();
        authorizer.addCommunity("public");
        authorizer.getCommunity("public")

        store.getModules(true);
        store.getModule("SNMPv2-MIB");
        store.getModuleNames(true);

        let providers: ESObject = store.getProvidersForModule("IF-MIB");
        mib.registerProviders(providers);
        mib.getProviders()
        mib.setScalarValue("ifNumber", 5);
        mib.getScalarValue("ifNumber", 2);

        mib.addTableRow("ifEntry",
          [1, "eth0", 6, 1500, 1000, "", 1, 1, 10, 1000, 100, 10, 0, 0, 0, 2000, 200, 20, 0, 0, 5, "0.0"]);
        mib.addTableRow("ifEntry",
          [2, "eth1", 6, 1500, 1000, "", 1, 1, 10, 1000, 100, 10, 0, 0, 0, 2000, 200, 20, 0, 0, 5, "0.0"]);
        mib.setTableSingleCell("ifEntry", 2, [1], "eth2");
        mib.getTableSingleCell("ifEntry", 2, [1])

        mib.getTableCells("ifEntry");

        mib.getTableColumnDefinitions("ifEntry");

        mib.getTableColumnCells("ifEntry", 2, true);

        mib.deleteTableRow("ifEntry", [2, 3]);

        mib.getTableRowCells("ifEntry", [1]);

        agent.getMib().dumpProviders();
        mib.dump({
          leavesOnly: true,
          showProviders: true,
          showValues: true,
          showTypes: true
        });

        agent.close();

        const mibRequest = (mibRequest: ESObject) => {
          mibRequest.done();
        }

        let myScalarProvider: ESObject = {
          name: "sysDescr",
          type: snmp.MibProviderType.Scalar,
          oid: "1.3.6.1.2.1.1.1",
          scalarType: snmp.ObjectType.OctetString,
          handler: mibRequest
        };

        let mib2: ESObject = snmp.createMib()
        mib2.registerProvider(myScalarProvider);
        mib2.getProvider('sysDescr')
        mib2.unregisterProvider("sysDescr");
      }
      let endTime = new Date().getTime()
      console.log("mib endTime:" + endTime);
      let averageTime = ((endTime - startTime) * 1000) / BASE_COUNT
      console.log("mib averageTime:" + averageTime + "μs");
      expect(averageTime < BASELINE_CREATEHTTP).assertTrue();
      done()
    })

    it('lcd', TestType.PERFORMANCE, async (done: Function) => {
      let startTime = new Date().getTime()

      let receiver: ESObject = snmp.createReceiver({
        disableAuthorization: true,
        accessControlModelType: snmp.AccessControlModelType.Simple,
        port: 1062
      }, (error: ESObject, trap: ESObject) => {
        if (error) {
          expect().assertFail()
        }
      });

      for (let index = 0; index < BASE_COUNT; index++) {
        let authorizer: ESObject = receiver.getAuthorizer();
        authorizer.getCommunities()
        authorizer.addCommunity("public");
        authorizer.addCommunity("private");
        authorizer.getCommunities()
        authorizer.getCommunity("public")
        authorizer.deleteCommunity("notfound");
        authorizer.getCommunities()

        authorizer.deleteCommunity("private");
        authorizer.getCommunities()
        authorizer.getUsers()
        authorizer.getAccessControlModelType()

        authorizer.addUser({
          name: "fred",
          level: snmp.SecurityLevel.noAuthNoPriv
        });

        authorizer.addUser({
          name: "wilma",
          level: snmp.SecurityLevel.authPriv,
          authProtocol: snmp.AuthProtocols.sha,
          authKey: "illhavesomeauth",
          privProtocol: snmp.PrivProtocols.des,
          privKey: "andsomepriv"
        });

        authorizer.getUsers()
        authorizer.getUser("fred")

        authorizer.deleteUser("wilma");

        let acm: ESObject = authorizer.getAccessControlModel();
        if (!!acm) {
          acm.setCommunityAccess("public", snmp.AccessLevel.ReadOnly);
          acm.setCommunityAccess("private", snmp.AccessLevel.ReadWrite);

          acm.getCommunityAccess("private")
          acm.getCommunityAccessLevel("private")
          acm.getCommunitiesAccess()

          acm.removeCommunityAccess("private");
          acm.setUserAccess("fred", snmp.AccessLevel.ReadOnly);
          acm.getUserAccessLevel("fred")
          acm.removeUserAccess("fred");
          acm.getUserAccess("fred")
          acm.getUsersAccess()
        }
        receiver.close()
      }
      let endTime = new Date().getTime()
      console.log("lcd endTime:" + endTime);
      let averageTime = ((endTime - startTime) * 1000) / BASE_COUNT
      console.log("lcd  averageTime:" + averageTime + "μs");
      expect(averageTime < BASELINE_CREATEHTTP).assertTrue();
      done()
    })

    it('subagent', TestType.PERFORMANCE, async (done: Function) => {
      let startTime = new Date().getTime()

      let agent: ESObject = snmp.createSubagent({
        debug: true,
        master: '192.168.0.2',
        masterPort: 8089,
        description: "Node net-snmp AgentX sub-agent",
      });

      for (let index = 0; index < BASE_COUNT; index++) {
        agent.registerProvider({
          name: "scalarString",
          type: snmp.MibProviderType.Scalar,
          oid: "1.3.6.1.4.1.8072.9999.9999.1",
          scalarType: snmp.ObjectType.OctetString
        }, null);

        agent.registerProvider({
          name: "scalarInt",
          type: snmp.MibProviderType.Scalar,
          oid: "1.3.6.1.4.1.8072.9999.9999.3",
          scalarType: snmp.ObjectType.Integer
        }, null);

        agent.getProviders()
        agent.getProvider("scalarString")
        let mib: ESObject = agent.getMib()

        mib.setScalarValue("scalarInt", 2000)
        mib.getScalarValue("scalarInt")
        agent.unregisterProvider("scalarString");
        agent.getProvider("scalarString")
        agent.addAgentCaps("1.3.6.1.4.1.8072.9999.9999", "Marks funk");
        agent.removeAgentCaps("1.3.6.1.4.1.8072.9999.9999");

      }
      let endTime = new Date().getTime()
      console.log("subagent endTime:" + endTime);
      let averageTime = ((endTime - startTime) * 1000) / BASE_COUNT
      console.log("subagent  averageTime:" + averageTime + "μs");
      expect(averageTime < BASELINE_CREATEHTTP).assertTrue();
      done()
    })

    it('proxy', TestType.PERFORMANCE, async (done: Function) => {
      let startTime = new Date().getTime()
      let agent: ESObject = snmp.createAgent({
        disableAuthorization: false,
        port: 162,
        engineID: "8000B98380XXXXXXXXXXXX",
        address: null,
        transport: "udp4"
      });

      for (let index = 0; index < BASE_COUNT; index++) {
        let forwarder: ESObject = agent.getForwarder();
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

        let proxy: ESObject = forwarder.getProxy("slatescontext")
        let proxies: ESObject = forwarder.getProxies()

        forwarder.dumpProxies()

        const mibRequest = (mibRequest: ESObject) => {
          mibRequest.done();
        }

        let myScalarProvider: ESObject = {
          name: "sysDescr",
          type: snmp.MibProviderType.Scalar,
          oid: "1.3.6.1.2.1.1.1",
          scalarType: snmp.ObjectType.OctetString,
          handler: mibRequest
        };

        let myScalarProvider1: ESObject = {
          name: "sysDescr1",
          type: snmp.MibProviderType.Scalar,
          oid: "1.3.6.1.2.8.1.9",
          scalarType: snmp.ObjectType.OctetString,
          handler: mibRequest
        };
        let mib: ESObject = agent.getMib();
        mib.registerProvider(myScalarProvider);

        mib.getProviders()
        mib.getProvider('sysDescr')
        mib.setScalarValue("sysDescr", "MyAwesomeHost");
        mib.getScalarValue("sysDescr", "hello");
        mib.unregisterProvider("sysDescr");
        mib.getProviders()

        mib.registerProviders([myScalarProvider, myScalarProvider1]);
        mib.getProviders()
      }
      let endTime = new Date().getTime()
      console.log("proxy endTime:" + endTime);
      let averageTime = ((endTime - startTime) * 1000) / BASE_COUNT
      console.log("proxy  averageTime:" + averageTime + "μs");
      expect(averageTime < BASELINE_CREATEHTTP).assertTrue();
      done()
    })

  })
}