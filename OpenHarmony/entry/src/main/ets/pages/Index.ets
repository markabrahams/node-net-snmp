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

import * as snmp from '@ohos/net-snmp';
import Buffer from '@ohos.buffer';

@Entry
@Component
struct Index {
  @State result: string = 'RESULT\r\n';
  private scrollerForScroll: Scroller = new Scroller()
  private ip = '192.168.0.2'

  build() {
    Scroll(this.scrollerForScroll) {
      Column() {
        TextInput({ text: this.ip, placeholder: $r('app.string.input_ip') })
          .border({ width: 1 }).padding(10).margin(5)
          .onChange((value: string) => {
            this.ip = value
          })

        Button($r('app.string.snmp_get'))
          .fontSize(20)
          .fontWeight(FontWeight.Bold)
          .alignRules({
            center: { anchor: '__container__', align: VerticalAlign.Center },
            middle: { anchor: '__container__', align: HorizontalAlign.Center }
          })
          .onClick(() => {
            let session: snmp.Session = snmp.createSession(this.ip, "public");
            let oids = ["1.3.6.1.2.1.1.5.0", "1.3.6.1.2.1.1.6.0"];
            this.result = " RESULT:\r\n"
            session.get(oids, (error: Error, varbinds: ESObject) => {
              if (error) {
                this.result += JSON.stringify(error)
                console.error("SNMP-->" + JSON.stringify(error));
              } else {
                for (let i = 0; i < varbinds.length; i++) {
                  if (snmp.isVarbindError(varbinds[i])) {
                    console.error("SNMP-->" + snmp.varbindError(varbinds[i]))
                  } else {
                    this.result += "oid:" + varbinds[i].oid + "   value:" + varbinds[i].value + '\r\n\r\n'
                    console.info("SNMP-->" + varbinds[i].oid + " = " + varbinds[i].value);
                  }
                }
              }
              session.close();
            });
          })

        Button($r('app.string.snmp_get_bulk'))
          .fontSize(20)
          .margin({ top: 10 })
          .fontWeight(FontWeight.Bold)
          .alignRules({
            center: { anchor: '__container__', align: VerticalAlign.Center },
            middle: { anchor: '__container__', align: HorizontalAlign.Center }
          })
          .onClick(() => {
            let oids = [
              "1.3.6.1.2.1.1.4.0",
              "1.3.6.1.2.1.1.5.0",
              "1.3.6.1.2.1.2.2.1.2",
              "1.3.6.1.2.1.2.2.1.3"
            ];

            let nonRepeaters = 2;
            let session: snmp.Session = snmp.createSession(this.ip, "public");
            this.result = " RESULT:\r\n"
            session.getBulk(oids, nonRepeaters, (error: Error, varbinds: ESObject) => {
              if (error) {
                this.result += JSON.stringify(error)
                console.error("SNMP-->error " + JSON.stringify(error));
              } else {
                for (let i = 0; i < nonRepeaters; i++) {
                  if (i >= varbinds.length) {
                    break;
                  }
                  if (snmp.isVarbindError(varbinds[i])) {
                    console.error("SNMP-->error " + snmp.varbindError(varbinds[i]));
                  } else {
                    this.result += "oid:" + varbinds[i].oid + "   value:" + varbinds[i].value + '\r\n\r\n'
                    console.info("SNMP-->  SNMP-->" + varbinds[i].oid + "|" + varbinds[i].value);
                  }
                }

                for (let i = nonRepeaters; i < varbinds.length; i++) {
                  for (let j = 0; j < varbinds[i].length; j++) {
                    if (snmp.isVarbindError(varbinds[i][j])) {
                      this.result += JSON.stringify(snmp.varbindError(varbinds[i][j]))
                      console.error("SNMP-->error " + snmp.varbindError(varbinds[i][j]));
                    } else {
                      this.result += "oid:" + varbinds[i][j].oid + "   value:" + varbinds[i][j].value + '\r\n\r\n'
                      console.info("SNMP-->  SNMP-->" + varbinds[i][j].oid + "|" + varbinds[i][j].value);
                    }
                  }
                }
              }
              session.close();
            });
          })

        Button($r('app.string.snmp_get_next'))
          .fontSize(20)
          .margin({ top: 10 })
          .fontWeight(FontWeight.Bold)
          .alignRules({
            center: { anchor: '__container__', align: VerticalAlign.Center },
            middle: { anchor: '__container__', align: HorizontalAlign.Center }
          })
          .onClick(() => {
            let oids = [
              "1.3.6.1.2.1.1.1.0",
              "1.3.6.1.2.1.1.4.0"
            ];

            this.result = " RESULT:\r\n"
            let session: snmp.Session = snmp.createSession(this.ip, "public");
            session.getNext(oids, (error: Error, varbinds: ESObject) => {
              if (error) {
                this.result += JSON.stringify(error)
                console.error("SNMP-->error " + JSON.stringify(error));
              } else {
                for (let i = 0; i < varbinds.length; i++) {
                  if (snmp.isVarbindError(varbinds[i])) {
                    this.result += JSON.stringify(snmp.varbindError(varbinds[i]))
                    console.error("SNMP-->error " + snmp.varbindError(varbinds[i]));
                  } else {
                    this.result += "oid:" + varbinds[i].oid + "   value:" + varbinds[i].value + '\r\n\r\n'
                    console.info("SNMP-->  SNMP-->" + varbinds[i].oid + "|" + varbinds[i].value);
                  }
                }
              }
              session.close();
            });
          })

        Button($r('app.string.snmp_subtree'))
          .fontSize(20)
          .margin({ top: 10 })
          .fontWeight(FontWeight.Bold)
          .alignRules({
            center: { anchor: '__container__', align: VerticalAlign.Center },
            middle: { anchor: '__container__', align: HorizontalAlign.Center }
          })
          .onClick(() => {
            this.result = " RESULT:\r\n"
            let oid = "1.3.6.1.2.1.1";
            let maxRepetitions = 20;
            let session: snmp.Session = snmp.createSession(this.ip, "public");
            session.subtree(oid, maxRepetitions, (varbinds: ESObject) => {
              for (let i = 0; i < varbinds.length; i++) {
                if (snmp.isVarbindError(varbinds[i])) {
                  this.result += snmp.varbindError(varbinds[i])
                  console.error("SNMP-->error " + snmp.varbindError(varbinds[i]));
                } else {
                  this.result += "oid:" + varbinds[i].oid + "   value:" + varbinds[i].value + '\r\n\r\n'
                  console.log(varbinds[i].oid + "|" + varbinds[i].value);
                }
              }
            }, (error: Error) => {
              if (error) {
                this.result += JSON.stringify(error)
                console.error("SNMP-->subtree error " + JSON.stringify(error));
              }
            });
          })

        Button($r('app.string.snmp_table'))
          .fontSize(20)
          .margin({ top: 10 })
          .fontWeight(FontWeight.Bold)
          .alignRules({
            center: { anchor: '__container__', align: VerticalAlign.Center },
            middle: { anchor: '__container__', align: HorizontalAlign.Center }
          })
          .onClick(() => {
            this.result = " RESULT:\r\n"
            let oid = "1.3.6.1.2.1.2.2";
            let session: snmp.Session = snmp.createSession(this.ip, "public");
            let maxRepetitions = 20;
            session.table(oid, maxRepetitions, (error: Error, table: ESObject) => {
              if (error) {
                this.result += JSON.stringify(error)
                console.error("SNMP-->" + JSON.stringify(error));
              } else {
                let indexes: number[] = [];
                const keys: string[] = Object.keys(table);
                for (const index of keys) {
                  indexes.push(parseInt(index));
                }
                indexes.sort();

                for (let i = 0; i < indexes.length; i++) {
                  let columns: number[] = [];
                  const keys: string[] = Object.keys(table[indexes[i]]);
                  for (const index of keys) {
                    columns.push(parseInt(index));
                  }
                  columns.sort(this.sortInt);
                  console.info("SNMP-->  row for index = " + indexes[i]);
                  for (let j = 0; j < columns.length; j++) {
                    this.result += "   column " + columns[j] + " = "
                      + table[indexes[i]][columns[j]] + "\r\n"
                  }
                }
              }
              session.close()
            });
          })

        Button($r('app.string.snmp_tableColumns'))
          .fontSize(20)
          .margin({ top: 10 })
          .fontWeight(FontWeight.Bold)
          .alignRules({
            center: { anchor: '__container__', align: VerticalAlign.Center },
            middle: { anchor: '__container__', align: HorizontalAlign.Center }
          })
          .onClick(() => {
            this.result = " RESULT:\r\n"
            let oid = "1.3.6.1.2.1.2.2";
            let columns = [2, 6];
            let session: snmp.Session = snmp.createSession(this.ip, "public");
            session.tableColumns(oid, columns, 20, (error: Error, table: ESObject) => {
              if (error) {
                this.result += JSON.stringify(error)
                console.error("SNMP-->tableColumns error " + JSON.stringify(error));
              } else {
                let indexes: number[] = [];
                const keys: string[] = Object.keys(table);
                for (const index of keys) {
                  indexes.push(parseInt(index));
                }
                indexes.sort();
                for (let i = 0; i < indexes.length; i++) {
                  let columns: number[] = [];
                  const keys: string[] = Object.keys(table[indexes[i]]);
                  for (const index of keys) {
                    columns.push(parseInt(index));
                  }
                  columns.sort(this.sortInt);
                  console.info("SNMP-->  row for index = " + indexes[i]);
                  for (let j = 0; j < columns.length; j++) {
                    this.result += "   column " + columns[j] + " = "
                      + table[indexes[i]][columns[j]] + "\r\n"
                  }
                }
              }
              session.close()
            });
          })

        Button($r('app.string.snmp_trap'))
          .fontSize(20)
          .margin({ top: 10 })
          .fontWeight(FontWeight.Bold)
          .alignRules({
            center: { anchor: '__container__', align: VerticalAlign.Center },
            middle: { anchor: '__container__', align: HorizontalAlign.Center }
          })
          .onClick(() => {
            this.result = " RESULT:\r\n"
            let trapOid = "1.3.6.1.4.1.2000.1";
            let session: snmp.Session = snmp.createSession(this.ip, "public");
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
            ], (error: Error) => {
              if (error) {
                this.result += JSON.stringify(error)
                console.dir(error);
              } else {
                this.result += "trap success"
              }
            });
          })

        Button($r('app.string.snmp_walk'))
          .fontSize(20)
          .margin({ top: 10 })
          .fontWeight(FontWeight.Bold)
          .alignRules({
            center: { anchor: '__container__', align: VerticalAlign.Center },
            middle: { anchor: '__container__', align: HorizontalAlign.Center }
          })
          .onClick(() => {
            this.result = " RESULT:\r\n"
            let oid = "1.3.6.1.2.1.1.5.0";
            let session: snmp.Session = snmp.createSession(this.ip, "public");
            session.walk(oid, 20, (varbinds: ESObject) => {
              for (let i = 0; i < varbinds.length; i++) {
                if (snmp.isVarbindError(varbinds[i])) {
                  console.error(snmp.varbindError(varbinds[i]));
                } else {
                  this.result += 'oid:' + varbinds[i].oid + '  value:' + varbinds[i].value + "\r\n"
                  console.log(varbinds[i].oid + "|" + varbinds[i].value);
                }
              }
            }, (error: Error) => {
              if (error) {
                console.error(JSON.stringify(error));
              }
            });

            setTimeout(() => {
              session.close()
            }, 2000)
          })

        Button($r('app.string.receiver_lcd'))
          .fontSize(20)
          .margin({ top: 10 })
          .fontWeight(FontWeight.Bold)
          .alignRules({
            center: { anchor: '__container__', align: VerticalAlign.Center },
            middle: { anchor: '__container__', align: HorizontalAlign.Center }
          })
          .onClick(() => {
            this.result = " RESULT:\r\n"
            let receiver: ESObject = snmp.createReceiver({
              disableAuthorization: true,
              accessControlModelType: snmp.AccessControlModelType.Simple,
              port: 1062
            }, (error: Error, trap: ESObject) => {
              if (error) {
                this.result += "createReceiver error:" + JSON.stringify(error)
                console.dir(error);
              } else {
                this.result += "createReceiver success:" + JSON.stringify(trap, null, 2)
                console.log(JSON.stringify(trap, null, 2));
              }
            });
            let authorizer: ESObject = receiver.getAuthorizer();
            this.result += "before addCommunity communities =" + JSON.stringify(authorizer.getCommunities()) +
              '\r\n\r\n';
            authorizer.addCommunity("public");
            this.result += "addCommunity public \r\n\r\n";
            authorizer.addCommunity("private");
            this.result += "addCommunity private \r\n\r\n";
            this.result += "getCommunities: " + JSON.stringify(authorizer.getCommunities()) + '\r\n\r\n';
            this.result += "getCommunity: " + JSON.stringify(authorizer.getCommunity("public")) + '\r\n\r\n';
            authorizer.deleteCommunity("notfound");
            this.result += "deleteCommunity notfound \r\n\r\n";
            this.result += "getCommunities :" + JSON.stringify(authorizer.getCommunities()) + '\r\n\r\n';
            authorizer.deleteCommunity("private");
            this.result += "deleteCommunity private \r\n\r\n";
            this.result += "getCommunities :" + JSON.stringify(authorizer.getCommunities()) + '\r\n\r\n';
            this.result += "getUsers =" + JSON.stringify(authorizer.getUsers()) + '\r\n\r\n';
            this.result += "getAccessControlModelType: " + JSON.stringify(authorizer.getAccessControlModelType()) +
              '\r\n\r\n';

            authorizer.addUser({
              name: "fred",
              level: snmp.SecurityLevel.noAuthNoPriv
            });
            this.result += "addUsers :" + JSON.stringify({
              name: "fred",
              level: snmp.SecurityLevel.noAuthNoPriv
            }) + '\r\n\r\n';
            authorizer.addUser({
              name: "wilma",
              level: snmp.SecurityLevel.authPriv,
              authProtocol: snmp.AuthProtocols.sha,
              authKey: "illhavesomeauth",
              privProtocol: snmp.PrivProtocols.des,
              privKey: "andsomepriv"
            });
            this.result += "addUsers :" + JSON.stringify({
              name: "wilma",
              level: snmp.SecurityLevel.authPriv,
              authProtocol: snmp.AuthProtocols.sha,
              authKey: "illhavesomeauth",
              privProtocol: snmp.PrivProtocols.des,
              privKey: "andsomepriv"
            }) + '\r\n\r\n';
            this.result += "getUsers" + JSON.stringify(authorizer.getUsers()) + '\r\n\r\n';
            this.result += "getUser fred : " + JSON.stringify(authorizer.getUser("fred")) + '\r\n\r\n';
            this.result += "getUser barney : " + JSON.stringify(authorizer.getUser("barney")) + '\r\n\r\n';
            authorizer.addUser({
              name: "wilma",
              level: snmp.SecurityLevel.authNoPriv,
              authProtocol: snmp.AuthProtocols.sha,
              authKey: "illhavesomeauth"
            });
            this.result += "addUsers :" + JSON.stringify({
              name: "wilma",
              level: snmp.SecurityLevel.authNoPriv,
              authProtocol: snmp.AuthProtocols.sha,
              authKey: "illhavesomeauth"
            }) + '\r\n\r\n';
            this.result += "getUsers" + JSON.stringify(authorizer.getUsers()) + '\r\n\r\n';
            authorizer.deleteUser("barney");


            this.result += "deleteUser barney" + '\r\n\r\n';
            this.result += "getUsers: " + JSON.stringify(authorizer.getUsers()) + '\r\n\r\n';
            authorizer.deleteUser("wilma");
            this.result += "deleteUser wilma" + '\r\n\r\n';
            this.result += "getUsers : " + JSON.stringify(authorizer.getUsers()) + '\r\n\r\n';

            let acm: ESObject = authorizer.getAccessControlModel();
            if (!!acm) {
              this.result += "getAccessControlModel success" + '\r\n\r\n';
              acm.setCommunityAccess("public", snmp.AccessLevel.ReadOnly);
              this.result += "setCommunityAccess public" + '\r\n\r\n';
              acm.setCommunityAccess("private", snmp.AccessLevel.ReadWrite);
              this.result += "setCommunityAccess private " + '\r\n\r\n';
              this.result += "getCommunityAccess private :" + JSON.stringify(acm.getCommunityAccess("private")) +
                '\r\n\r\n';

              this.result += "getCommunityAccessLevel private :" +
              JSON.stringify(acm.getCommunityAccessLevel("private")) +
                '\r\n\r\n';

              this.result += "getCommunityAccess: " + JSON.stringify(acm.getCommunitiesAccess()) + '\r\n\r\n';
              acm.removeCommunityAccess("private");
              this.result += "removeCommunityAccess private" + '\r\n\r\n';
              this.result += "getCommunityAccess private :" + JSON.stringify(acm.getCommunityAccess("private")) +
                '\r\n\r\n';
              acm.setUserAccess("fred", snmp.AccessLevel.ReadOnly);
              this.result += "setUserAccess fred " + '\r\n\r\n';
              acm.setUserAccess("barney", snmp.AccessLevel.ReadWrite);
              this.result += "setUserAccess barney " + '\r\n\r\n';

              this.result += "getUserAccessLevel :" + JSON.stringify(acm.getUserAccessLevel("fred")) + '\r\n\r\n';
              acm.removeUserAccess("fred");
              this.result += "removeUserAccess fred " + '\r\n\r\n';
              this.result += "getUserAccess barney:" + JSON.stringify(acm.getUserAccess("barney")) + '\r\n\r\n';
              this.result += "getUsersAccess:" + JSON.stringify(acm.getUsersAccess()) + '\r\n\r\n';
            }
            receiver.close()
            this.result += "receiver close success" + '\r\n\r\n';
          })

        Button($r('app.string.snmp_mib'))
          .fontSize(20)
          .margin({ top: 10 })
          .fontWeight(FontWeight.Bold)
          .alignRules({
            center: { anchor: '__container__', align: VerticalAlign.Center },
            middle: { anchor: '__container__', align: HorizontalAlign.Center }
          })
          .onClick(() => {
            this.result = " RESULT:\r\n"
            let resManager: ESObject = snmp.GlobalContext.getContext().getValue("resourceManager")
            let store: ESObject = snmp.createModuleStore(resManager);
            this.result += "createModuleStore success " + '\r\n\r\n';
            let agent: ESObject = snmp.createAgent({
              disableAuthorization: false,
              port: 1026,
              engineID: "8000B98380XXXXXXXXXXXX",
              address: '192.168.0.3',
              transport: "udp4"
            }, (error: ESObject, data: ESObject) => {
              if (error) {
                this.result += "createAgent error : " + JSON.stringify(error) + '\r\n\r\n';
                console.info("SNMP-->createAgent error" + JSON.stringify(error));
              } else {
                this.result += "createAgent success : " + '\r\n\r\n';
                console.info("SNMP-->createAgent success: " + data.pdu.varbinds[0].oid);
              }
            });
            let mib: ESObject = agent.getMib();
            agent.setMib(mib)
            this.result += "setMib success : " + '\r\n\r\n';
            mib == agent.getMib();
            this.result += "agent getMib : " + JSON.stringify(mib) + '\r\n\r\n';
            let authorizer: ESObject = agent.getAuthorizer();

            this.result += "agent getAuthorizer : " + JSON.stringify(authorizer) + '\r\n\r\n';
            authorizer.addCommunity("public");
            this.result += "authorizer addCommunity success " + '\r\n\r\n';

            this.result += "authorizer getCommunity : " + JSON.stringify(authorizer.getCommunity("public")) +
              '\r\n\r\n';

            store.loadFromFile("IANAifType-MIB.mib", resManager);
            store.loadFromFile("IF-MIB.mib", resManager);

            this.result += "loadFromFile success " + '\r\n\r\n';
            let modules: ESObject = store.getModules(true);
            this.result += "getModules: " + JSON.stringify(modules).slice(0, 500) + '\r\n\r\n';
            let one: ESObject = store.getModule("SNMPv2-MIB");
            this.result += "getModule: " + JSON.stringify(one).slice(0, 500) + '\r\n\r\n';
            let names: ESObject = store.getModuleNames(true);
            this.result += "getModuleNames: " + JSON.stringify(names) + '\r\n\r\n';

            let providers: ESObject = store.getProvidersForModule("IF-MIB");
            this.result += "getProvidersForModule : " + JSON.stringify(providers).slice(0, 500) + '\r\n\r\n';
            mib.registerProviders(providers);
            this.result += "registerProviders success " + '\r\n\r\n';
            let providers1: ESObject = mib.getProviders()
            this.result += "getProviders : " + JSON.stringify(providers1).slice(0, 500) + '\r\n\r\n';
            mib.setScalarValue("ifNumber", 5);
            this.result += "setScalarValue success: " + '\r\n\r\n';
            let ifNumberValue: number = mib.getScalarValue("ifNumber", 2);
            this.result += "getScalarValue : " + ifNumberValue + '\r\n\r\n';

            mib.addTableRow("ifEntry",
              [1, "eth0", 6, 1500, 1000, "", 1, 1, 10, 1000, 100, 10, 0, 0, 0, 2000, 200, 20, 0, 0, 5, "0.0"]);
            mib.addTableRow("ifEntry",
              [2, "eth1", 6, 1500, 1000, "", 1, 1, 10, 1000, 100, 10, 0, 0, 0, 2000, 200, 20, 0, 0, 5, "0.0"]);
            this.result += "addTableRow success " + '\r\n\r\n';
            mib.setTableSingleCell("ifEntry", 2, [1], "eth2");
            this.result += "setTableSingleCell success " + '\r\n\r\n';

            let tableSingleCell: ESObject = mib.getTableSingleCell("ifEntry", 2, [1])
            this.result += "getTableSingleCell : " + JSON.stringify(tableSingleCell) + '\r\n\r\n';

            let getTableCells: ESObject = mib.getTableCells("ifEntry");
            this.result += "getTableCells : " + JSON.stringify(getTableCells) + '\r\n\r\n';

            let tableColumnDefinitions: ESObject = mib.getTableColumnDefinitions("ifEntry");
            this.result += "getTableColumnDefinitions : " + JSON.stringify(tableColumnDefinitions) + '\r\n\r\n';

            let getTableColumnCells: ESObject = mib.getTableColumnCells("ifEntry", 2, true);
            this.result += "getTableColumnCells : " + JSON.stringify(getTableColumnCells).slice(0, 500) + '\r\n\r\n';

            mib.deleteTableRow("ifEntry", [2, 3]);
            this.result += "deleteTableRow success" + '\r\n\r\n';
            let ifEntryRow1: ESObject = mib.getTableRowCells("ifEntry", [1]);
            this.result += "getTableRowCells : " + JSON.stringify(ifEntryRow1) + '\r\n\r\n';

            agent.getMib().dumpProviders();
            mib.dump({
              leavesOnly: true,
              showProviders: true,
              showValues: true,
              showTypes: true
            });
            this.result += "dump success " + '\r\n\r\n';

            agent.close();
            this.result += "agent close success" + '\r\n\r\n'

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

            let mib2: ESObject = snmp.createMib()
            this.result += "createMib success " + '\r\n\r\n';
            mib2.registerProvider(myScalarProvider);
            mib2.registerProvider(myScalarProvider1)
            this.result += "registerProvider success " + '\r\n\r\n';

            this.result += "getProviders: " + JSON.stringify(mib2.getProviders()) + '\r\n\r\n';
            this.result += "getProvider: " + JSON.stringify(mib2.getProvider('sysDescr')) + '\r\n\r\n';
            mib2.unregisterProvider("sysDescr");
            this.result += "unregisterProvider success " + '\r\n\r\n';
            this.result += "getProviders: " + JSON.stringify(mib2.getProviders()) + '\r\n\r\n';
          })


        Button($r('app.string.agentx_subagent'))
          .fontSize(20)
          .margin({ top: 10 })
          .fontWeight(FontWeight.Bold)
          .alignRules({
            center: { anchor: '__container__', align: VerticalAlign.Center },
            middle: { anchor: '__container__', align: HorizontalAlign.Center }
          })
          .onClick(() => {
            this.result += "" + '\r\n\r\n';
            let agent: ESObject = snmp.createSubagent({
              debug: true,
              master: '192.168.0.2',
              masterPort: 8089,
              description: "Node net-snmp AgentX sub-agent",
            });

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

            this.result += "registerProvider success" + '\r\n\r\n';
            this.result += "getProviders success: " + JSON.stringify(agent.getProviders()) + '\r\n\r\n';

            this.result += "getProvider (scalarString) : " + JSON.stringify(agent.getProvider("scalarString")) +
              '\r\n\r\n';

            let mib: ESObject = agent.getMib()
            mib.setScalarValue("scalarInt", 2000)
            this.result += "getScalarValue :" + JSON.stringify(mib.getScalarValue("scalarInt")) + '\r\n\r\n';
            agent.unregisterProvider("scalarString");
            this.result += "unregisterProvider success" + '\r\n\r\n';
            agent.addAgentCaps("1.3.6.1.4.1.8072.9999.9999", "Marks funk");
            this.result += "addAgentCaps success" + '\r\n\r\n';
            agent.removeAgentCaps("1.3.6.1.4.1.8072.9999.9999");
            this.result += "removeAgentCaps success" + '\r\n\r\n';
          })

        Button($r('app.string.snmp_proxy'))
          .fontSize(20)
          .margin({ top: 10 })
          .fontWeight(FontWeight.Bold)
          .alignRules({
            center: { anchor: '__container__', align: VerticalAlign.Center },
            middle: { anchor: '__container__', align: HorizontalAlign.Center }
          })
          .onClick(() => {
            this.result = " RESULT:\r\n"
            let agent: ESObject = snmp.createAgent({
              disableAuthorization: false,
              port: 162,
              engineID: "8000B98380XXXXXXXXXXXX",
              address: null,
              transport: "udp4"
            });

            let forwarder: ESObject = agent.getForwarder();
            if (!!forwarder) {
              this.result += "getForwarder success " + '\r\n\r\n';
            } else {
              this.result += "getForwarder error" + '\r\n\r\n'
            }

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

            this.result += "addProxy success " + '\r\n\r\n';
            let proxy: ESObject = forwarder.getProxy("slatescontext")
            if (!!proxy) {
              this.result += "getProxy success " + '\r\n\r\n';
            } else {
              this.result += "getProxy error" + '\r\n\r\n'
            }

            let proxies: ESObject = forwarder.getProxies()
            if (!!proxies) {
              this.result += "getProxies success " + '\r\n\r\n';
            } else {
              this.result += "getProxies error" + '\r\n\r\n'
            }

            forwarder.dumpProxies()
            this.result += "dumpProxies success " + '\r\n\r\n';

            forwarder.deleteProxy("slatescontext")
            let proxy1: ESObject = forwarder.getProxy("slatescontext")
            if (proxy1) {
              this.result += "deleteProxy success " + '\r\n\r\n';
            } else {
              this.result += "deleteProxy error" + '\r\n\r\n'
            }

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
            this.result += "registerProvider success " + '\r\n\r\n';
            this.result += "getProviders: " + JSON.stringify(mib.getProviders()) + '\r\n\r\n';
            this.result += "getProvider: " + JSON.stringify(mib.getProvider('sysDescr')) + '\r\n\r\n';
            mib.setScalarValue("sysDescr", "MyAwesomeHost");
            this.result += "setScalarValue success " + '\r\n\r\n';
            let sysDescr: number = mib.getScalarValue("sysDescr", "hello");
            this.result += "getScalarValue : " + sysDescr + '\r\n\r\n';

            mib.unregisterProvider("sysDescr");
            this.result += "unregisterProvider success " + '\r\n\r\n';
            this.result += "getProviders: " + JSON.stringify(mib.getProviders()) + '\r\n\r\n';

            mib.registerProviders([myScalarProvider,myScalarProvider1]);
            this.result += "registerProvider success " + '\r\n\r\n';
            this.result += "getProviders: " + JSON.stringify(mib.getProviders()) + '\r\n\r\n';
          })


        Text(this.result)
          .fontSize(12)
          .width('100%')
      }
      .width('100%')
    }.width('100%').height('100%').backgroundColor(0xDCDCDC).padding(20)
  }

  sortInt(a: number, b: number) {
    if (a > b) {
      return 1;
    } else if (b > a) {
      return -1;
    } else {
      return 0;
    }
  }

  counter64(num: number) {
    let buf = Buffer.alloc(4);
    buf.writeUInt32BE(num);
    return buf;
  }
}