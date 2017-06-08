import Config from '../../config';
import {Database} from '../Database';
import {Utils} from '../Utils';
import {Signal} from '../Signal';
import Promise from '../../../modules/es6-promise/es6-promise.auto.min';

export class PeerClient{
    /**
     * 客户端
     * @live 生存时间，默认3000ms
     * @onCandidate       收到候选信息的回调
     */
    constructor(live, onCandidate){

        let RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
        this.obj = new RTCPeerConnection(Config.p2p);                  //p2p对象
        this.live = live ? live:3000;                                 //生存时间
        this.release = null;                                          //过期释放函数初始化为空
        this.setRelease();                                            //一旦创建就会发生释放
        this.mission = null;                                          //任务
        this.targetAddress = null;                                    //对方地址
        this.targetTimestamp = null;                                  //对方时间戳

        this.timestamp = new Date().valueOf();                        //时间戳，用来唯一标识一个客户端

        this.setOnIceCandidate();                                     //采用默认的接收候选信息回调
    };

    /**
     * 设置释放客户端
     * @timeout         timeout 毫秒后释放this.obj
     */
    setRelease = (timeout) => {
        let peerclient = this;

        //不设置则重新根据生存时间设置；设置了则重设live属性
        if(!timeout){
            timeout = this.live;
        } else{
            this.live = timeout;
        }
        //取消之前的释放函数
        if(this.release){
            try{
                clearTimeout(this.release);
            }catch (e){}
        }
        //重新设置释放函数，准备到点释放函数
        this.release = setTimeout(function(){
            //执行立刻释放
            peerclient.releaseImmediately();
        }, timeout);
    };

    /**
     * 立刻释放客户端
     * @data              数据(如果传入了数据，则执行任务的成功回调；如果不传，则执行任务的失败回调)
     */
    releaseImmediately = (data) => {
        //释放发送数据通道
        try{
            this.sendChannel.close();
        }catch(e){}
        this.sendChannel = null;

        //释放p2p客户端
        try{
            this.obj.close();
        }catch(e){}
        this.obj = null;

        //释放任务（可能不存在任务，因为这个客户端是用来提供数据的）
        if(data){
            //成功
            if(this.mission && this.mission.succeed){
                this.mission.succeed(data);
            }
        }else{
            //失败
            if(this.mission && this.mission.fail){
                this.mission.fail();
            }
        }

        //释放目标地址
        this.targetAddress = null;
        //释放时间戳
        this.timestamp = null;
    };


    /**
     * 中断释放客户端(执行后客户端为空则失败)
     */
    cutRelease = function(){
        //强制取消之前的释放函数
        try{
            clearTimeout(this.release);
        }catch (e){}
        this.release = null;
        //返回本次中断结果
        return !!this.obj;
    };


    /**
     * 是否为空（obj对象是否为null）
     */
    isEmpty = () => {
        return this.obj === null;
    };

    /**
     * 重新构造客户端
     */
    rebuild = () => {
        let RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
        this.obj = new RTCPeerConnection(Config.p2p);     //p2p对象
        //重新设置过期时间
        this.setRelease();
        //重新设置时间戳
        this.timestamp = new Date().valueOf();                        //时间戳，用来唯一标识一个客户端
    };

    /*** 真正P2P传输所用的客户端 ***/
    /**
     * 本地描述信息是否匹配
     * @desc
     */
    hasLocalDesc = (desc) =>{
        return this.obj && this.obj.localDescription === desc;
    };
    /**
     * 绑定任务
     * @mission       任务
     */
    setMission = (mission) => {
        this.mission = mission;
    };
    /**
     * 获取任务
     */
    getMission = () => {
        return this.mission;
    };

    /**
     * 获取时间戳
     */
    getTimestamp = () => {
        return this.timestamp;
    };
    /**
     * 时间戳是否一致
     * @timestamp
     */
    hasTimestamp = (timestamp) => {
        return timestamp === this.timestamp;
    };

    /**
     * 目标地址是否匹配
     * @targetAddress   目标地址
     */
    hasTargetAddress = (targetAddress) =>{
        return this.targetAddress === targetAddress;
    };
    /**
     * 绑定目标
     * @targetAddress         对方地址
     */
    bindTargetAddress = (targetAddress) => {
        this.targetAddress = targetAddress;
    };
    /**
     * 准备传输数据（文件不做分块）
     * @url                   数据的url表示
     */
    prepareOffer = (url) => {
        return new Promise((resolve, reject) => {
            Database.getData(url).then((dbRes) => {
                //获取了数据
                let blob = dbRes.data;
                //构建传输通道
                if(peerclient.sendChannel){
                    try{
                        peerclient.sendChannel.close();
                    }catch(e){
                        console.warn("创建传输通道发生错误，代码写错了");
                    }
                }

                this.sendChannel = this.obj.createDataChannel('sendDataChannel');
                this.sendChannel.binaryType = 'arraybuffer';
                //当客户端打开时
                this.sendChannel.onopen = () => {
                    if( this.sendChannel.readyState === "open"){
                        console.log(peerclient.obj.sendChannel);
                        console.log("传输通道开启，开始传输");
                        Utils.file.blob2binary(blob).then((binaryData) =>{
                            console.log("获得了二进制数据");
                            this.sendChannel.send(binaryData);

                            //此时数据传输已经完成，释放客户端
                            //peerclient.releaseImmediately();
                        }).catch(function(e){
                            console.log(e);
                        });
                    }
                };
                //当客户端关闭时
                this.sendChannel.onclose = function(e){};
                resolve();
            }).catch(function(error){
                //获取数据失败
                reject(error);
            });
        });
    };
    /**
     * 准备描述对象
     */
    createOffer = function(){
        //返回promise对象
        return new Promise((resolve, reject) => {
            //如果对象为空，则爆出空指针
            if(!this.obj){
                reject("ERROR: NULL POINT");
                return;
            }

            this.obj.createOffer().then(
                (desc) =>{
                    //保存描述
                    this.obj.setLocalDescription(desc);
                    //传递自我描述
                    resolve(desc);
                },
                (error) => {
                    reject(error);
                }
            );
        });
    };
    /**
     * 准备响应
     */
    prepareAnswer = () => {
        //构建接受通道
        this.obj.ondatachannel = (e) => {
            //保存数据通道
            let receiveChannel = e.channel;
            receiveChannel.binaryType = 'arraybuffer';
            let blob;
            receiveChannel.onmessage = (e) => {
                console.log('接收通道开启，开始接收');

                blob = new Blob([event.data]);
                //关闭数据传输通道
                receiveChannel.close();
                //释放客户端，因为传入了参数，执行任务的成功回调
                this.releaseImmediately(blob);
            };
            receiveChannel.onclose = function(){
                //client.releaseImmediately(blob);
            }
        };
    };
    /**
     * 响应描述
     * @desc
     */
    answerDesc = (desc) => {
        //返回promise对象
        return new Promise((resolve, reject) =>{
            //如果对象为空，则爆出空指针
            if(!this.obj){
                reject("ERROR: NULL POINT");
                return;
            }

            this.obj.setRemoteDescription(desc);
            this.obj.createAnswer().then(
                (desc) => {
                    //保存desc
                    this.obj.setLocalDescription(desc);
                    //进入下一个状态
                    resolve(desc);
                },
                (error) => {
                    reject(error);
                }
            );
        });
    };
    /**
     * 保存响应描述
     * @desc              描述信息
     */
    storeAnswerDesc = (desc) => {
        return new Promise((resolve, reject) => {
            //如果对象为空，则爆出空指针
            if(!this.obj){
                reject("ERROR: NULL POINT");
                return;
            }

            //执行到此说明一切正常，则继续
            this.obj.setRemoteDescription(desc);
            resolve();
        });
    };
    /**
     * 保存候选信息
     * @candidate
     */
    setCandidate = (candidate) =>{
        this.obj.addIceCandidate(candidate);
    };

    /**
     * 注入候选信息时回调
     * @callback(RTCPeerConnection, iceCandidate)     回调
     */
    setOnIceCandidate = (callback) => {
        //如果存在回调，则使用自定义回调
        if(callback && typeof callback === 'function'){
            this.obj.onicecandidate = (e) => {
                if(e.candidate){
                    callback(this, e.candidate);
                }
            };
            return;
        }

        //指定到此则采用默认回调
        this.obj.onicecandidate = (e) => {
            let msg;

            if(e.candidate){
                console.warn("--------发送候选信息");
                //组装消息
                //检查自己是offer还是answer
                switch(this.obj.localDescription.type){
                    case 'offer':
                        //发送候选信息
                        msg = {
                            code: 3005,
                            data: {
                                offer: {
                                    //时间戳
                                    timestamp:  this.timestamp,
                                    //资源描述
                                    desc:       this.obj.localDescription,
                                    //候选信息
                                    candidate:  e.candidate
                                },
                                answer: {
                                    //时间戳
                                    timestamp:  this.targetTimestamp,
                                    //资源描述
                                    desc:       this.obj.remoteDescription,
                                    //IP地址
                                    address:    this.targetAddress
                                }
                            }
                        };
                        break;
                    case 'answer':
                        //发送候选信息
                        msg = {
                            code:         3005,
                            data:{
                                offer:  {
                                    //时间戳
                                    timestamp:  this.targetTimestamp,
                                    //资源描述
                                    desc:       this.obj.remoteDescription,
                                    //IP地址
                                    address:    this.targetAddress
                                },
                                answer: {
                                    //时间戳
                                    timestamp:  this.timestamp,
                                    //资源描述
                                    desc:       this.obj.localDescription,
                                    //候选信息
                                    candidate:  e.candidate
                                }
                            }
                        };
                        break;
                }
                //消息组装好了，发送
                console.log('发送候选信息');
                console.log(msg);
                Signal.send(JSON.stringify(msg));
            }
        };
    };
}