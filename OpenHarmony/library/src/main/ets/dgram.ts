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

import { events } from "@ohos/node-polyfill";
import { socket } from '@kit.NetworkKit';
import buffer from '@ohos.buffer';
import { BusinessError } from '@kit.BasicServicesKit';
import { connection } from '@kit.NetworkKit';
import { JSON } from '@kit.ArkTS';

interface RemoteInfo {
    address: string;
    family: 'IPv4' | 'IPv6';
    port: number;
    size: number;
}

type SocketType = 'udp4' | 'udp6';

class Socket extends events.EventEmitter {
    private TAG: string = "dgram "
    private udp: socket.UDPSocket = null
    private type: string = ""

    constructor(type) {
        super();
        this.type = type
        this.udp = socket.constructUDPSocketInstance();
    }

    on(event: string, listener: (msg: buffer.Buffer, rinfo?: RemoteInfo) => void): this {
        switch (event) {
            case "close":
                this.udp.on('close', () => {
                    console.info(this.TAG + "on close success");
                    listener(null)
                });
                break
            case "message":
                this.udp.on('message', (value: socket.SocketMessageInfo) => {
                    console.info(this.TAG + "on message, message:" + JSON.stringify(value))
                    const remoteInfo: RemoteInfo = {
                        address: value.remoteInfo.address,
                        family: value.remoteInfo.family,
                        port: value.remoteInfo.port,
                        size: value.remoteInfo.size
                    }
                    let buffers = buffer.from(value.message)
                    listener(buffers, remoteInfo)
                });
                break
            case "error":
                this.udp.on('error', (err: BusinessError) => {
                    console.info(this.TAG + "on error, err:" + JSON.stringify(err))
                    listener(null)
                });
                break
        }
        return this
    }

    bind(port?: number, address?: string, callback?: () => void) {
        let bindAddr: socket.NetAddress = undefined
        if (!!port && !!address) {
            bindAddr = {
                address: address,
                port: port,
                family: this.type == "udp4" ? -1 : -2
            }
        } else if (!!!port && !!address) {
            bindAddr = {
                address: address,
                family: this.type == "udp4" ? -1 : -2
            }
        } else if (!!port && !!!address) {
            let localIpAddress = this.getIp()
            bindAddr = {
                address: localIpAddress,
                port: port,
                family: this.type == "udp4" ? -1 : -2
            }
        }
        this.udp.bind(bindAddr, (err: BusinessError) => {
            if (err) {
                console.info(this.TAG + "udp bind fail:" + JSON.stringify(err))
                return;
            }
            console.info(this.TAG + "udp bind success")
            if (!!callback) {
                callback()
            }
        });
    }

    close(callback?: () => void): this {
        this.udp.close((err: BusinessError) => {
            if (err) {
                console.info(this.TAG + "udp close fail:" + JSON.stringify(err))
                return;
            }
            console.info(this.TAG + "udp socket close success:")
            if (!!callback) {
                callback()
            }
        })
        return this
    }

    send(msg: string | buffer.Buffer, offset: number, length: number, port?: number, address?: string,
        callback?: (error: Error | null, bytes: number) => void): void {

        let data: ArrayBuffer | string
        if (msg instanceof buffer.Buffer) {
            data = msg.buffer
        } else {
            data = msg
        }
        let netAddress: socket.NetAddress = {
            address: address,
            port: port
        }
        let sendOptions: socket.UDPSendOptions = {
            data: data,
            address: netAddress
        }
        let localIpAddress = this.getIp()
        if (localIpAddress == "") {
            callback(new Error("ip address is empty"), null)
            return
        }
        this.bind(null, localIpAddress, () => {
            console.info(this.TAG + "send sendOptions :" + JSON.stringify(sendOptions.data))
            this.udp.send(sendOptions, (err: BusinessError) => {
                if (err) {
                    if (!!callback) {
                        callback(err, null)
                        console.info(this.TAG + "send fail :" + JSON.stringify(err))
                    }
                    return;
                }
                callback(null, null)
                console.info(this.TAG + "send success")
            });
        })
    }

    private getIp(): string {
        let netHandle = connection.getDefaultNetSync()
        if (netHandle.netId == 0) { // 当前无默认网络时
            return "";
        }
        let connectionProperties = connection.getConnectionPropertiesSync(netHandle)
        return connectionProperties.linkAddresses[0].address.address;
    }
}


export default class dgram {
    static createSocket(type: SocketType): Socket {
        return new Socket(type);
    }
}

