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

import { describe, expect, it } from '@ohos/hypium';
import * as snmp from '@ohos/net-snmp';

export default function abilityTest() {
  let serverAddress = "192.168.0.2"
  let TAG: string = "SNMP -->"

  describe('ActsAbilityTest', () => {
    it('snmp_get', 0, () => {
      let startTime = new Date().getTime()
      let session: snmp.Session = snmp.createSession(serverAddress, "public");
      console.info(TAG + "snmp.createSession consuming time: " + (new Date().getTime() - startTime) + " ms")

      let oids = ["1.3.6.1.2.1.1.5.0", "1.3.6.1.2.1.1.6.0"];
      let startTime1 = new Date().getTime()
      session.get(oids, (error: ESObject, varbinds: ESObject) => {
        if (error) {
          session.close();
          expect().assertFail()
        } else {
          console.info(TAG + "session.get consuming time: " + (new Date().getTime() - startTime1) + " ms")
          session.close();
        }
      });
    });

    it('snmp_get_bulk', 0, () => {
      let oids = [
        "1.3.6.1.2.1.1.4.0",
        "1.3.6.1.2.1.1.5.0",
        "1.3.6.1.2.1.2.2.1.2",
        "1.3.6.1.2.1.2.2.1.3"
      ];

      let nonRepeaters = 2;
      let session: snmp.Session = snmp.createSession(serverAddress, "public");
      let startTime1 = new Date().getTime()
      session.getBulk(oids, nonRepeaters, (error: ESObject, varbinds: ESObject) => {
        if (error) {
          expect(false).assertTrue();
        } else {
          console.info(TAG + "session.getBulk consuming time: " + (new Date().getTime() - startTime1) + " ms")
          for (let i = 0; i < nonRepeaters; i++) {
            if (i >= varbinds.length) {
              break;
            }
            if (snmp.isVarbindError(varbinds[i])) {
              expect().assertFail()
            }
          }

          for (let i = nonRepeaters; i < varbinds.length; i++) {
            for (let j = 0; j < varbinds[i].length; j++) {
              if (snmp.isVarbindError(varbinds[i][j])) {
                expect().assertFail()
              }
            }
          }
          let startTime2 = new Date().getTime()
          session.close();
          console.info(TAG + "session.close consuming time: " + (new Date().getTime() - startTime2) + " ms")
        }
      });
    });

    it('snmp_get_next', 0, () => {
      let oids = [
        "1.3.6.1.2.1.1.1.0",
        "1.3.6.1.2.1.1.4.0"
      ];

      let startTime = new Date().getTime()
      let session: snmp.Session = snmp.createSession(serverAddress, "public");
      console.info(TAG + "snmp.createV3Session consuming time: " + (new Date().getTime() - startTime) + " ms")
      let startTime1 = new Date().getTime()
      session.getNext(oids, (error: ESObject, varbinds: ESObject) => {
        if (error) {
          expect().assertFail()
        } else {
          console.info(TAG + "session.getNext consuming time: " + (new Date().getTime() - startTime1) + " ms")
          for (let i = 0; i < varbinds.length; i++) {
            if (snmp.isVarbindError(varbinds[i])) {
              expect().assertFail()
            }
          }
          session.close();
        }
      });
    });

    it('snmp_subtree', 0, () => {
      let oid = "1.3.6.1.2.1.1";
      let maxRepetitions = 20;
      let session: snmp.Session = snmp.createSession(serverAddress, "public");
      let startTime = new Date().getTime()

      session.subtree(oid, maxRepetitions, (varbinds: ESObject) => {
        console.info(TAG + "session.subtree consuming time: " + (new Date().getTime() - startTime) + " ms")
        session.close();
      }, (error: ESObject) => {
        session.close();
        expect().assertFail()
      });
    });

    it('snmp_table', 0, () => {
      let oid = "1.3.6.1.2.1.2.2";
      let session: snmp.Session = snmp.createSession(serverAddress, "public");
      let maxRepetitions = 20;
      let startTime = new Date().getTime()
      session.table(oid, maxRepetitions, (error: ESObject, table: ESObject) => {
        if (error) {
          session.close();
          expect().assertFail()
        } else {
          console.info(TAG + "session.table consuming time: " + (new Date().getTime() - startTime) + " ms")
          session.close();
        }
      });
    });

    it('snmp_tableColumns', 0, () => {
      let oid = "1.3.6.1.2.1.2.2";
      let columns = [2, 6];
      let session: snmp.Session = snmp.createSession(serverAddress, "public");
      let startTime = new Date().getTime()
      session.tableColumns(oid, columns, 20, (error: ESObject, table: ESObject) => {
        if (error) {
          session.close();
          expect().assertFail();
        } else {
          console.info(TAG + "session.tableColumns consuming time: " + (new Date().getTime() - startTime) + " ms")
          session.close();
        }
      });
    });

    it('snmp_trap', 0, () => {
      let trapOid = "1.3.6.1.4.1.2000.1";
      let session: snmp.Session = snmp.createSession(serverAddress, "public");
      let startTime = new Date().getTime()
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
          expect().assertFail()
        } else {
          console.info(TAG + "session.trap consuming time: " + (new Date().getTime() - startTime) + " ms")
          session.close();
        }
      });
    });

    it('snmp_walk', 0, () => {
      let oid = "1.3.6.1.2.1.1.5.0";
      let session: snmp.Session = snmp.createSession(serverAddress, "public");
      let startTime = new Date().getTime()

      session.walk(oid, 20, (varbinds: ESObject) => {
        session.close();
      }, (error: ESObject) => {
        console.info(TAG + "session.walk consuming time: " + (new Date().getTime() - startTime) + " ms")
        if (error) {
          session.close();
          expect().assertFail()
        }
      });
    });

    it('snmp_lcd', 0, () => {
      let startTime = new Date().getTime()
      let receiver: ESObject = snmp.createReceiver({
        disableAuthorization: true,
        accessControlModelType: snmp.AccessControlModelType.Simple,
        port: 1062
      });
      console.info(TAG + "snmp.createReceiver consuming time: " + (new Date().getTime() - startTime) + " ms")
      let startTime1 = new Date().getTime()
      let authorizer: ESObject = receiver.getAuthorizer();
      console.info(TAG + "receiver.getAuthorizer consuming time: " + (new Date().getTime() - startTime1) + " ms")

      let startTime2 = new Date().getTime()
      expect(authorizer.getCommunities()).assertDeepEquals([])
      console.info(TAG + "authorizer.getCommunities() consuming time: " + (new Date().getTime() - startTime2) + " ms")
      authorizer.addCommunity("public");

      let startTime3 = new Date().getTime()
      authorizer.addCommunity("private");
      console.info(TAG + "authorizer.addCommunity consuming time: " + (new Date().getTime() - startTime3) + " ms")

      let startTime4 = new Date().getTime()
      expect(authorizer.getCommunities()).assertDeepEquals(['public', 'private'])
      console.info(TAG + "authorizer.getCommunities consuming time: " + (new Date().getTime() - startTime4) + " ms")

      let startTime5 = new Date().getTime()
      expect(authorizer.getCommunity("public")).assertDeepEquals('public')
      console.info(TAG + "authorizer.getCommunity consuming time: " + (new Date().getTime() - startTime5) + " ms")

      let startTime6 = new Date().getTime()
      authorizer.deleteCommunity("notfound");
      console.info(TAG + "authorizer.deleteCommunity consuming time: " + (new Date().getTime() - startTime6) + " ms")
      expect(authorizer.getCommunities()).assertDeepEquals(['public', 'private'])

      authorizer.deleteCommunity("private");
      expect(authorizer.getCommunities()).assertDeepEquals(['public'])

      expect(authorizer.getUsers()).assertDeepEquals([])

      let startTime8 = new Date().getTime()
      expect(authorizer.getAccessControlModelType()).assertEqual(1)
      console.info(TAG + "authorizer.getAccessControlModelType consuming time: " + (new Date().getTime() - startTime8) +
        " ms")

      let startTime9 = new Date().getTime()
      authorizer.addUser({
        name: "fred",
        level: snmp.SecurityLevel.noAuthNoPriv
      });
      console.info(TAG + "authorizer.addUser consuming time: " + (new Date().getTime() - startTime9) + " ms")

      authorizer.addUser({
        name: "wilma",
        level: snmp.SecurityLevel.authPriv,
        authProtocol: snmp.AuthProtocols.sha,
        authKey: "illhavesomeauth",
        privProtocol: snmp.PrivProtocols.des,
        privKey: "andsomepriv"
      });


      expect(authorizer.getUsers()).assertDeepEquals([{
        "name": "fred", "level": 1
      }, {
        "name": "wilma",
        "level": 3,
        "authProtocol": 3,
        "authKey": "illhavesomeauth",
        "privProtocol": 2,
        "privKey": "andsomepriv"
      }])

      let startTime10 = new Date().getTime()
      expect(authorizer.getUser("fred")).assertDeepEquals({
        "name": "fred", "level": 1
      })
      console.info(TAG + "authorizer.getUser(name) consuming time: " + (new Date().getTime() - startTime10) + " ms")

      let startTime11 = new Date().getTime()
      authorizer.deleteUser("wilma");
      console.info(TAG + "authorizer.deleteUser(name) consuming time: " + (new Date().getTime() - startTime11) + " ms")

      let startTime12 = new Date().getTime()
      expect(authorizer.getUsers()).assertDeepEquals([{
        "name": "fred", "level": 1
      }])
      console.info(TAG + "authorizer.getUsers consuming time: " + (new Date().getTime() - startTime12) + " ms")

      let startTime13 = new Date().getTime()
      let acm: ESObject = authorizer.getAccessControlModel();
      console.info(TAG + "authorizer.getAccessControlModel consuming time: " + (new Date().getTime() - startTime13) +
        " ms")
      if (!!acm) {
        let startTime14 = new Date().getTime()
        acm.setCommunityAccess("public", snmp.AccessLevel.ReadOnly);
        console.info(TAG + "SimpleAccessControlModel.setCommunityAccess consuming time: " +
          (new Date().getTime() - startTime14) + " ms")
        acm.setCommunityAccess("private", snmp.AccessLevel.ReadWrite);

        let startTime15 = new Date().getTime()
        expect(acm.getCommunityAccess("private")).assertDeepEquals({
          "community": "private", "level": 2
        })
        console.info(TAG + "SimpleAccessControlModel.getCommunityAccess consuming time: " +
          (new Date().getTime() - startTime15) + " ms")

        let startTime16 = new Date().getTime()
        expect(acm.getCommunityAccessLevel("private")).assertDeepEquals(2)
        console.info(TAG + "SimpleAccessControlModel.getCommunityAccessLevel(community) consuming time: " +
          (new Date().getTime() - startTime16) + " ms")

        let startTime17 = new Date().getTime()
        expect(acm.getCommunitiesAccess()).assertDeepEquals([{
          "community": "private", "level": 2
        }, {
          "community": "public", "level": 1
        }])
        console.info(TAG + "SimpleAccessControlModel.getCommunitiesAccess() consuming time: " +
          (new Date().getTime() - startTime17) + " ms")

        let startTime18 = new Date().getTime()
        acm.removeCommunityAccess("private");
        console.info(TAG + "SimpleAccessControlModel.removeCommunityAccess consuming time: " +
          (new Date().getTime() - startTime18) + " ms")

        let startTime19 = new Date().getTime()
        expect(acm.getCommunityAccess("private")).assertUndefined()
        console.info(TAG + "SimpleAccessControlModel.getCommunityAccess(community) consuming time: " +
          (new Date().getTime() - startTime19) + " ms")

        let startTime20 = new Date().getTime()
        acm.setUserAccess("fred", snmp.AccessLevel.ReadOnly);
        console.info(TAG + "SimpleAccessControlModel.setUserAccess consuming time: " +
          (new Date().getTime() - startTime20) + " ms")

        acm.setUserAccess("barney", snmp.AccessLevel.ReadWrite);

        let startTime21 = new Date().getTime()
        expect(acm.getUserAccessLevel("fred")).assertDeepEquals(1)
        console.info(TAG + "SimpleAccessControlModel.getUserAccessLevel consuming time: " +
          (new Date().getTime() - startTime21) + " ms")

        let startTime22 = new Date().getTime()
        acm.removeUserAccess("fred");
        console.info(TAG + "SimpleAccessControlModel.removeUserAccess consuming time: " +
          (new Date().getTime() - startTime22) + " ms")

        let startTime23 = new Date().getTime()
        expect(acm.getUserAccess("fred")).assertUndefined()
        console.info(TAG + "SimpleAccessControlModel.getUserAccess consuming time: " +
          (new Date().getTime() - startTime23) + " ms")

        expect(acm.getUserAccess("barney")).assertDeepEquals({
          "userName": "barney", "level": 2
        })

        let startTime24 = new Date().getTime()
        expect(acm.getUsersAccess()).assertDeepEquals([{
          "userName": "barney", "level": 2
        }, {
          "userName": "wilma", "level": 1
        }])
        console.info(TAG + "SimpleAccessControlModel.getUsersAccess consuming time: " +
          (new Date().getTime() - startTime24) + " ms")
      }

      let startTime25 = new Date().getTime()
      receiver.close()
      console.info(TAG + "receiver.close consuming time: " + (new Date().getTime() - startTime25) + " ms")
    });

    it('snmp_mib', 0, () => {
      let resManager: ESObject = snmp.GlobalContext.getContext().getValue("resourceManager")

      let startTime = new Date().getTime()
      let store: ESObject = snmp.createModuleStore(resManager);
      console.info(TAG + "snmp.createModuleStore consuming time: " + (new Date().getTime() - startTime) + " ms")

      expect(store).not().assertUndefined()

      let startTime0 = new Date().getTime()
      let agent: ESObject = snmp.createAgent({
        disableAuthorization: false,
        port: 1026,
        engineID: "8000B98380XXXXXXXXXXXX",
        address: '192.168.0.3',
        transport: "udp4"
      });
      console.info(TAG + "snmp.createAgent consuming time: " + (new Date().getTime() - startTime0) + " ms")
      let startTime1 = new Date().getTime()
      let mib: ESObject = agent.getMib();
      console.info(TAG + "agent.getMib consuming time: " + (new Date().getTime() - startTime1) + " ms")
      expect(JSON.stringify(mib))
        .assertDeepEquals("{\"root\":{\"address\":[],\"oid\":\"\",\"parent\":null,\"children\":{}},\"providerNodes\":{},\"providersByOid\":{},\"providers\":{}}")

      let startTime2 = new Date().getTime()
      agent.setMib(mib)
      console.info(TAG + "agent.setMib consuming time: " + (new Date().getTime() - startTime2) + " ms")
      mib == agent.getMib();
      expect(JSON.stringify(mib))
        .assertDeepEquals("{\"root\":{\"address\":[],\"oid\":\"\",\"parent\":null,\"children\":{}},\"providerNodes\":{},\"providersByOid\":{},\"providers\":{}}")

      let startTime3 = new Date().getTime()
      let authorizer: ESObject = agent.getAuthorizer();
      console.info(TAG + "agent.getAuthorizer consuming time: " + (new Date().getTime() - startTime3) + " ms")
      expect(JSON.stringify(authorizer))
        .assertDeepEquals("{\"communities\":[],\"users\":[],\"disableAuthorization\":false,\"accessControlModelType\":0,\"accessControlModel\":null}")

      let startTime4 = new Date().getTime()
      authorizer.addCommunity("public");
      console.info(TAG + "authorizer.addCommunity consuming time: " + (new Date().getTime() - startTime4) + " ms")


      let startTime5 = new Date().getTime()
      expect(authorizer.getCommunity("public")).assertDeepEquals("public")
      console.info(TAG + "authorizer.getCommunity consuming time: " + (new Date().getTime() - startTime5) + " ms")


      let startTime6 = new Date().getTime()
      store.loadFromFile("IANAifType-MIB.mib", resManager);
      console.info(TAG + " store.loadFromFileb consuming time: " + (new Date().getTime() - startTime6) + " ms")

      store.loadFromFile("IF-MIB.mib", resManager);

      let startTime7 = new Date().getTime()
      let modules: ESObject = store.getModules(true);
      console.info(TAG + " store.getModules consuming time: " + (new Date().getTime() - startTime7) + " ms")
      expect(modules).not().assertUndefined()

      let startTime8 = new Date().getTime()
      let one: ESObject = store.getModule("SNMPv2-MIB");
      console.info(TAG + " store.getModule consuming time: " + (new Date().getTime() - startTime8) + " ms")
      expect(one).not().assertUndefined()

      let startTime9 = new Date().getTime()
      let names: ESObject = store.getModuleNames(true);
      console.info(TAG + " store.getModuleNames consuming time: " + (new Date().getTime() - startTime9) + " ms")
      expect(names)
        .assertDeepEquals(["RFC1155-SMI", "RFC1158-MIB", "RFC-1212", "RFC1213-MIB", "RFC-1215", "SNMPv2-SMI",
          "SNMPv2-CONF", "SNMPv2-TC", "SNMPv2-MIB", "IANAifType-MIB", "IF-MIB"])

      let startTime10 = new Date().getTime()
      let providers: ESObject = store.getProvidersForModule("IF-MIB");
      console.info(TAG + " store.getProvidersForModule consuming time: " + (new Date().getTime() - startTime10) + " ms")
      expect(providers).not().assertUndefined()

      let startTime11 = new Date().getTime()
      mib.registerProviders(providers);
      console.info(TAG + " mib.registerProviders consuming time: " + (new Date().getTime() - startTime11) + " ms")

      let startTime12 = new Date().getTime()
      let providers1: ESObject = mib.getProviders()
      console.info(TAG + " mib.getProviders consuming time: " + (new Date().getTime() - startTime12) + " ms")
      expect(providers1).not().assertUndefined()

      let startTime13 = new Date().getTime()
      mib.setScalarValue("ifNumber", 5);
      console.info(TAG + " mib.setScalarValue consuming time: " + (new Date().getTime() - startTime13) + " ms")

      let startTime14 = new Date().getTime()
      let ifNumberValue: number = mib.getScalarValue("ifNumber", 2);
      console.info(TAG + " mib.getScalarValue consuming time: " + (new Date().getTime() - startTime14) + " ms")
      expect(ifNumberValue).assertDeepEquals(5)

      let startTime15 = new Date().getTime()
      mib.addTableRow("ifEntry",
        [1, "eth0", 6, 1500, 1000, "", 1, 1, 10, 1000, 100, 10, 0, 0, 0, 2000, 200, 20, 0, 0, 5, "0.0"]);
      console.info(TAG + " mib.addTableRow consuming time: " + (new Date().getTime() - startTime15) + " ms")


      mib.addTableRow("ifEntry",
        [2, "eth1", 6, 1500, 1000, "", 1, 1, 10, 1000, 100, 10, 0, 0, 0, 2000, 200, 20, 0, 0, 5, "0.0"]);

      let startTime16 = new Date().getTime()
      mib.setTableSingleCell("ifEntry", 2, [1], "eth2");
      console.info(TAG + " mib.setTableSingleCell consuming time: " + (new Date().getTime() - startTime16) + " ms")

      let startTime17 = new Date().getTime()
      let tableSingleCell: ESObject = mib.getTableSingleCell("ifEntry", 2, [1])
      console.info(TAG + " mib.getTableSingleCell consuming time: " + (new Date().getTime() - startTime17) + " ms")
      expect(tableSingleCell).assertDeepEquals('eth2')

      let startTime18 = new Date().getTime()
      let getTableCells: ESObject = mib.getTableCells("ifEntry");
      console.info(TAG + " mib.getTableCells consuming time: " + (new Date().getTime() - startTime18) + " ms")
      expect(getTableCells)
        .assertDeepEquals([[1, 2], ["eth2", "eth1"], [6, 6], [1500, 1500], [1000, 1000], ["", ""], [1, 1], [1, 1],
          [10, 10], [1000, 1000], [100, 100], [10, 10], [0, 0], [0, 0], [0, 0], [2000, 2000], [200, 200], [20, 20],
          [0, 0], [0, 0], [5, 5], ["0.0", "0.0"]])

      let startTime19 = new Date().getTime()
      let tableColumnDefinitions: ESObject = mib.getTableColumnDefinitions("ifEntry");
      console.info(TAG + " mib.getTableColumnDefinitions consuming time: " + (new Date().getTime() - startTime19) +
        " ms")
      expect(tableColumnDefinitions).not().assertUndefined()

      let startTime20 = new Date().getTime()
      let getTableColumnCells: ESObject = mib.getTableColumnCells("ifEntry", 2, true);
      console.info(TAG + " mib.getTableColumnCells consuming time: " + (new Date().getTime() - startTime20) + " ms")
      expect(getTableColumnCells).assertDeepEquals([[[1], [2]], ["eth2", "eth1"]]);

      let startTime21 = new Date().getTime()
      mib.deleteTableRow("ifEntry", [2, 3]);
      console.info(TAG + " mib.deleteTableRow consuming time: " + (new Date().getTime() - startTime21) + " ms")

      let startTime22 = new Date().getTime()
      let ifEntryRow1: ESObject = mib.getTableRowCells("ifEntry", [1]);
      console.info(TAG + " mib.getTableRowCells consuming time: " + (new Date().getTime() - startTime22) + " ms")
      expect(ifEntryRow1)
        .assertDeepEquals([1, "eth2", 6, 1500, 1000, "", 1, 1, 10, 1000, 100, 10, 0, 0, 0, 2000, 200, 20, 0, 0, 5,
          "0.0"]);

      let startTime23 = new Date().getTime()
      agent.getMib().dumpProviders();
      console.info(TAG + " mib.dumpProviders consuming time: " + (new Date().getTime() - startTime23) + " ms")

      let startTime24 = new Date().getTime()
      mib.dump({
        leavesOnly: true,
        showProviders: true,
        showValues: true,
        showTypes: true
      });
      console.info(TAG + " mib.dump consuming time: " + (new Date().getTime() - startTime24) + " ms")

      let startTime25 = new Date().getTime()
      agent.close();
      console.info(TAG + " agent.close consuming time: " + (new Date().getTime() - startTime25) + " ms")

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
        oid: "1.3.6.1.2.1.1.1",
        scalarType: snmp.ObjectType.OctetString,
        handler: mibRequest
      };

      let startTime26 = new Date().getTime()
      let mib2: ESObject = snmp.createMib()
      console.info(TAG + " snmp.createMib consuming time: " + (new Date().getTime() - startTime26) + " ms")

      let startTime27 = new Date().getTime()
      mib2.registerProvider(myScalarProvider);
      console.info(TAG + " mib.registerProvider consuming time: " + (new Date().getTime() - startTime27) + " ms")
      mib2.registerProvider(myScalarProvider1);

      let startTime28 = new Date().getTime()
      expect(JSON.stringify(mib2.getProvider('sysDescr')))
        .assertDeepEquals("{\"name\":\"sysDescr\",\"type\":1,\"oid\":\"1.3.6.1.2.1.1.1\",\"scalarType\":4}");
      console.info(TAG + " mib.getProvider consuming time: " + (new Date().getTime() - startTime28) + " ms")

      let startTime29 = new Date().getTime()
      mib2.unregisterProvider("sysDescr");
      console.info(TAG + " mib.unregisterProvider consuming time: " + (new Date().getTime() - startTime29) + " ms")
      expect(mib2.getProvider('sysDescr')).assertUndefined();
    });

    it('agentx_subagent', 0, () => {
      let startTime1 = new Date().getTime()
      let agent: ESObject = snmp.createSubagent({
        debug: true,
        master: '192.168.0.2',
        masterPort: 8089,
        description: "Node net-snmp AgentX sub-agent",
      });
      console.info(TAG + "snmp.createSubagent consuming time: " + (new Date().getTime() - startTime1) + " ms")

      let startTime = new Date().getTime()
      agent.registerProvider({
        name: "scalarString",
        type: snmp.MibProviderType.Scalar,
        oid: "1.3.6.1.4.1.8072.9999.9999.1",
        scalarType: snmp.ObjectType.OctetString
      }, null);
      console.info(TAG + "subagent.registerProvider consuming time: " + (new Date().getTime() - startTime) + " ms")

      agent.registerProvider({
        name: "scalarInt",
        type: snmp.MibProviderType.Scalar,
        oid: "1.3.6.1.4.1.8072.9999.9999.3",
        scalarType: snmp.ObjectType.Integer
      }, null);

      let startTime2 = new Date().getTime()
      expect(JSON.stringify(agent.getProviders()))
        .assertDeepEquals("{\"scalarString\":{\"name\":\"scalarString\",\"type\":1,\"oid\":\"1.3.6.1.4.1.8072.9999.9999.1\",\"scalarType\":4},\"scalarInt\":{\"name\":\"scalarInt\",\"type\":1,\"oid\":\"1.3.6.1.4.1.8072.9999.9999.3\",\"scalarType\":2}}")
      console.info(TAG + "subagent.getProviders consuming time: " + (new Date().getTime() - startTime2) + " ms")

      let startTime3 = new Date().getTime()
      expect(JSON.stringify(agent.getProvider("scalarString")))
        .assertDeepEquals("{\"name\":\"scalarString\",\"type\":1,\"oid\":\"1.3.6.1.4.1.8072.9999.9999.1\",\"scalarType\":4}")
      console.info(TAG + "subagent.getProvider consuming time: " + (new Date().getTime() - startTime3) + " ms")


      let startTime4 = new Date().getTime()
      let mib: ESObject = agent.getMib()
      console.info(TAG + "subagent.getMib consuming time: " + (new Date().getTime() - startTime4) + " ms")
      expect(mib).not().assertUndefined()

      mib.setScalarValue("scalarInt", 2000)
      expect(mib.getScalarValue("scalarInt")).assertDeepEquals(2000)

      let startTime5 = new Date().getTime()
      agent.unregisterProvider("scalarString");
      console.info(TAG + "subagent.unregisterProvider consuming time: " + (new Date().getTime() - startTime5) + " ms")

      let startTime6 = new Date().getTime()
      expect(JSON.stringify(agent.getProvider("scalarString"))).assertUndefined()
      console.info(TAG + "subagent.getProvider consuming time: " + (new Date().getTime() - startTime6) + " ms")
      try {
        let startTime7 = new Date().getTime()
        agent.addAgentCaps("1.3.6.1.4.1.8072.9999.9999", "Marks funk");
        console.info(TAG + "subagent.addAgentCaps consuming time: " + (new Date().getTime() - startTime7) + " ms")

        let startTime8 = new Date().getTime()
        agent.removeAgentCaps("1.3.6.1.4.1.8072.9999.9999");
        console.info(TAG + "subagent.removeAgentCaps consuming time: " + (new Date().getTime() - startTime8) + " ms")
      } catch (e) {
        expect().assertFail()
      }
    });

    it('snmp_proxy', 0, () => {
      let agent: ESObject = snmp.createAgent({
        disableAuthorization: false,
        port: 162,
        engineID: "8000B98380XXXXXXXXXXXX",
        address: null,
        transport: "udp4"
      });

      let startTime1 = new Date().getTime()
      let forwarder: ESObject = agent.getForwarder();
      console.info(TAG + "agent.getForwarder consuming time: " + (new Date().getTime() - startTime1) + " ms")
      expect(forwarder).not().assertUndefined()

      let startTime2 = new Date().getTime()
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
      console.info(TAG + "forwarder.addProxy consuming time: " + (new Date().getTime() - startTime2) + " ms")

      let startTime3 = new Date().getTime()
      let proxy: ESObject = forwarder.getProxy("slatescontext")
      console.info(TAG + "forwarder.getProxy consuming time: " + (new Date().getTime() - startTime3) + " ms")
      expect(proxy).not().assertUndefined()

      let startTime4 = new Date().getTime()
      let proxies: ESObject = forwarder.getProxies()
      console.info(TAG + "forwarder.getProxies consuming time: " + (new Date().getTime() - startTime4) + " ms")
      expect(proxies).not().assertUndefined()

      let startTime5 = new Date().getTime()
      forwarder.dumpProxies()
      console.info(TAG + "forwarder.dumpProxies consuming time: " + (new Date().getTime() - startTime5) + " ms")

      startTime5 = new Date().getTime()
      forwarder.deleteProxy("slatescontext")
      console.info(TAG + "forwarder.deleteProxy consuming time: " + (new Date().getTime() - startTime5) + " ms")
      let proxy1: ESObject = forwarder.getProxy("slatescontext")
      expect(proxy1).assertUndefined()

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
      expect(mib).not().assertUndefined()

      mib.registerProvider(myScalarProvider);

      expect(JSON.stringify(mib.getProviders()))
        .assertDeepEquals("{\"sysDescr\":{\"name\":\"sysDescr\",\"type\":1,\"oid\":\"1.3.6.1.2.1.1.1\",\"scalarType\":4}}")

      expect(JSON.stringify(mib.getProvider('sysDescr')))
        .assertDeepEquals("{\"name\":\"sysDescr\",\"type\":1,\"oid\":\"1.3.6.1.2.1.1.1\",\"scalarType\":4}")

      mib.setScalarValue("sysDescr", "MyAwesomeHost");
      let sysDescr: number = mib.getScalarValue("sysDescr", "hello");
      expect(sysDescr).assertEqual("MyAwesomeHost")
      mib.unregisterProvider("sysDescr");
      expect(mib.getProviders()).assertDeepEquals({})

      mib.registerProviders([myScalarProvider, myScalarProvider1]);
      expect(JSON.stringify(mib.getProviders()))
        .assertDeepEquals("{\"sysDescr\":{\"name\":\"sysDescr\",\"type\":1,\"oid\":\"1.3.6.1.2.1.1.1\",\"scalarType\":4},\"sysDescr1\":{\"name\":\"sysDescr1\",\"type\":1,\"oid\":\"1.3.6.1.2.8.1.9\",\"scalarType\":4}}")
    });
  })
}