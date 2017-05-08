(function(){
    if(window.ppdf){
        var manger = {
            pool:                   [],                     //连接池对象
        };


        //导出的对象
        window.ppdf.p2p = {
            //客户端
            /**
             * 初始化
             */
            check:   function(){
                return new Promise(function(resolve, reject){
                    if(!window.RTCPeerConnection && !window.webkitRTCPeerConnection && !window.mozRTCPeerConnection){
                        reject(new window.ppdf.Utils.Error(40021, "不支持P2P", null));
                    }else{
                        //var RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
                        //ppdf.p2p.client = new RTCPeerConnection(window.ppdf.config.p2p);
                        resolve();
                    }
                });
            },
            /**
             * 构建描述对象
             */
            startDesc:  function(){
                return new Promise(function(resolve, reject){
                    if(!ppdf.p2p.client){
                        reject(new ppdf.Utils.Error(40022, "没有创建客户端", null));
                    }else{
                        ppdf.p2p.client.createOffer().then(
                            function gotDescription(desc){
                                //保存描述
                                ppdf.p2p.client.setLocalDescription(desc);
                                //传递自我描述
                                resolve(desc);
                            },
                            function onCreateSessionDescriptionError(error){
                                reject(new ppdf.Utils.Error(40023, "发起连接请求失败", error));
                            }
                        );
                    }
                });
            },
            /**
             * 发起连接
             * @websocket                       websocket连接对象
             */
            connect:    function(websocket){
                return new Promise(function(resolve, reject){
                    if(!websocket){
                        reject(new ppdf.Utils.Error(40022, "没有打开信道服务器", null));
                    } else if(!ppdf.p2p.client){
                        reject(new ppdf.Utils.Error(40023, "没有创建客户端", null));
                    }else{
                        ppdf.p2p.client.createOffer().then(
                            function gotDescription(desc){
                                //保存描述
                                ppdf.p2p.client.setLocalDescription(desc);
                                //进入下一个状态
                                resolve(desc);
                                //通知接受方自己的描述
                                //remoteConnection.setRemoteDescription(desc);
                                //remoteConnection.createAnswer().then(
                                //    gotDescription2,
                                //    onCreateSessionDescriptionError
                                //);
                            },
                            function onCreateSessionDescriptionError(error){
                                reject(new ppdf.Utils.Error(40024, "发起连接请求失败", error));
                            }
                        );
                    }
                });
            },

            //发送
            send:{
                channel:                null,
                send:                   null,

                /**
                 * 通道状态改变时执行的操作
                 */
                onChannelStateChange:   function(){
                    if(ppdf.p2p.send.channel && ppdf.p2p.send.channel.readyState && ppdf.p2p.send.channel.readyState == "open"){

                    }
                },
                /**
                 * 注册该操作什么数据
                 */
                register: function(){

                }
            },
            //接受
            receive:{
                channel:                null,
            },





            /*** 测试的代码 ***/
            test:{
                /**
                 * 获取客户端
                 */
                getClient:  function(){
                    var RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
                    return new RTCPeerConnection(window.ppdf.config.p2p);
                },
                /**
                 * 构建描述对象
                 * @client
                 */
                startDesc:  function(client){
                    return new Promise(function(resolve, reject){
                        client.createOffer().then(
                            function gotDescription(desc){
                                //保存描述
                                client.setLocalDescription(desc);
                                //传递自我描述
                                resolve(desc);
                            },
                            function onCreateSessionDescriptionError(error){
                                reject(new ppdf.Utils.Error(40023, "发起连接请求失败", error));
                            }
                        );
                    });
                },
            }
        };
    }
})();