/**
 * 客户端
 * @live 生存时间，默认3000ms
 * @onCandidate       收到候选信息的回调
 */
window.ppdf.p2p.PeerClient = function(live, onCandidate){
    var RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
    this.obj = new RTCPeerConnection(window.ppdf.config.p2p);     //p2p对象
    this.live = live ? live:3000;                                 //生存时间
    this.release = null;                                          //过期释放函数初始化为空
    this.setRelease();                                            //一旦创建就会发生释放
    this.mission = null;                                          //任务
    this.targetAddress = null;                                    //对方地址
  
    this.timestamp = new Date().valueOf();                        //时间戳，用来唯一标识一个客户端
  
    this.setOnIceCandidate();                                     //采用默认的接收候选信息回调
};
/**
 * 设置释放客户端
 * @timeout         timeout 毫秒后释放this.obj
 */
window.ppdf.p2p.PeerClient.prototype.setRelease = function(timeout){
  var peerclient = this;
  
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
window.ppdf.p2p.PeerClient.prototype.releaseImmediately = function(data){
  //释放发送数据通道
  try{
    this.obj.sendChannel.close();
  }catch(e){}
  this.obj.sendChannel = null;
  
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
window.ppdf.PeerClient.prototype.cutRelease = function(){
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
window.ppdf.PeerClient.prototype.isEmpty = function(){
  if(this.obj == null){
    return true;
  }else{
    return false;
  }
};
/**
 * 重新构造客户端
 */
window.ppdf.PeerClient.prototype.rebuild = function(){
  var RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
  this.obj = new RTCPeerConnection(window.ppdf.config.p2p);     //p2p对象
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
window.ppdf.p2p.PeerClient.prototype.hasLocalDesc = function(desc){
  if(this.obj && this.obj.localDescription == desc){
    return true;
  }else{
    return false;
  }
};
/**
 * 绑定任务
 * @mission       任务
 */
window.ppdf.p2p.PeerClient.prototype.setMission = function(mission){
  this.mission = mission;
};
/**
 * 获取任务
 */
window.ppdf.p2p.PeerClient.prototype.getMission = function(){
  return this.mission;
};

/**
 * 获取时间戳
 */
window.ppdf.p2p.PeerClient.prototype.getTimestamp = function(){
  return this.timestamp;
};
/**
 * 时间戳是否一致
 * @timestamp
 */
window.ppdf.p2p.PeerClient.prototype.hasTimestamp = function(timestamp){
  return timestamp == this.timestamp;
};

/**
 * 目标地址是否匹配
 * @targetAddress   目标地址
 */
window.ppdf.p2p.PeerClient.prototype.hasTargetAddress = function(targetAddress){
  return this.targetAddress == targetAddress;
};
/**
 * 绑定目标
 * @targetAddress         对方地址
 */
window.ppdf.p2p.PeerClient.prototype.bindTargetAddress = function(targetAddress){
  this.targetAddress = targetAddress;
};
/**
 * 准备传输数据（文件不做分块）
 * @url                   数据的url表示
 */
window.ppdf.p2p.PeerClient.prototype.prepareOffer = function(url){
  var peerclient = this.obj;
  return new Promise(function(resovle, reject){
    window.ppdf.database.getData(url).then(function(dbRes){
      //获取了数据
      var blob = dbRes.data;
      //构建传输通道
      if(peerclient.sendChannel){
        try{
          peerclient.sendChannel.close();
        }catch(e){
          console.warn("创建传输通道发生错误，代码写错了");
        }
      }
      
      peerclient.sendChannel = peerclient.createDataChannel('sendDataChannel');
      peerclient.sendChannel.binaryType = 'arraybuffer';
      //当客户端打开时
      peerclient.sendChannel.onopen = function(e){
        window.ppdf.Utils.file.blob2binary(blob).then(function(binaryData){
          peerclient.sendChannel.send(binaryData);
        });
        //此时数据传输已经完成，释放客户端
        peerclient.releaseImmediately();
      };
      //当客户端关闭时
      peerclient.sendChannel.onclose = function(e){};
    }).catch(function(error){
      //获取数据失败
      reject(error);
    });
  });
};
/**
 * 准备描述对象
 */
window.ppdf.p2p.PeerClient.prototype.createOffer = function(){
  var client = this.obj;
  
  //返回promise对象
  return new Promise(function(resolve, reject){
      //如果对象为空，则爆出空指针
      if(!client){
        reject("ERROR: NULL POINT");
        return;
      }
    
      client.createOffer().then(
          function gotDescription(desc){
              //保存描述
              ppdf.p2p.client.setLocalDescription(desc);
              //传递自我描述
              resolve(desc);
          },
          function onCreateSessionDescriptionError(error){
              reject(error);
          }
      );
  });
};
/**
 * 准备响应
 */
window.ppdf.p2p.PeerClient.prototype.prepareAnswer = function(){
  var client = this.obj;
  //构建接受通道
  client.ondatachannel = function(e) {
    //保存数据通道
    var receiveChannel = e.channel;
    receiveChannel.binaryType = 'arraybuffer';
    var blob;
    receiveChannel.onmessage = function(e){
      blob = new Blob([event.data]);
    };
    receiveChannel.onclose = function(){
      //释放客户端，因为传入了参数，执行任务的成功回调
      client.releaseImmediately(blob);
    }
  };
};
/**
 * 响应描述
 * @desc
 */
window.ppdf.p2p.PeerClient.prototype.answerDesc = function(desc){
  var client = this.obj;
  
  //返回promise对象
  return new Promise(function(resolve, reject){
    //如果对象为空，则爆出空指针
    if(!client){
      reject("ERROR: NULL POINT");
      return;
    }
    
    client.setRemoteDescription(desc);
    client.createAnswer().then(
      function(desc){
        //保存desc
        client.setLocalDescription(desc);
        //进入下一个状态
        resolve(desc);
      },
      function onCreateSessionDescriptionError(error){
        reject(error);
      }
    );
  });
};
/**
 * 保存响应描述
 * @desc              描述信息
 */
window.ppdf.p2p.PeerClient.prototype.storeAnswerDesc = function(desc){
  return new Promise(function(resovle, reject){
    //如果对象为空，则爆出空指针
    if(!client){
      reject("ERROR: NULL POINT");
      return;
    }
    
    //执行到此说明一切正常，则继续
    this.obj.setRemoteDescription(desc);
  });
};
/**
 * 保存候选信息
 * @candidate
 */
window.ppdf.p2p.PeerClient.prototype.setCandidate = function(candidate){
  this.obj.addIceCandidate(candidate);
};

/**
 * 注入候选信息时回调
 * @callback(RTCPeerConnection, iceCandidate)     回调
 */
window.ppdf.p2p.PeerClient.prototype.setOnIceCandidate = function(callback){
  var peerclient = this;
  
  //如果存在回调，则使用自定义回调
  if(callback && typeof callback == 'function'){
    this.obj.onicecandidate = function(e) {
      if(e.candidate){
        callback(this, e.candidate);
      }
    };
    return;
  }
  
  //指定到此则采用默认回调
  this.obj.onicecandidate = function(e) {
    if(e.candidate){
      //检查自己是offer还是answer
      switch(this.localDescription.type){
        case 'offer':
          //发送候选信息
          window.ppdf.signal.send(JSON.stringify({
            code:         3005,
            data:{
              offer:  {
                //时间戳
                timestamp:  peerclient.timestamp,
                //资源描述
                desc:       this.localDescription,
                //候选信息
                candidate:  e.candidate
              },
              answer: {
                //资源描述
                desc:       this.remoteDescription,
                //IP地址
                address:    peerclient.targetAddress
              }
            }
          }));
          break;
        case 'answer':
          //发送候选信息
          window.ppdf.signal.send(JSON.stringify({
            code:         3005,
            data:{
              offer:  {
                //资源描述
                desc:       this.remoteDescription,
                //IP地址
                address:    peerclient.targetAddress
              },
              answer: {
                //时间戳
                timestamp:  peerclient.timestamp,
                //资源描述
                desc:       this.localDescription,
                //候选信息
                candidate:  e.candidate
              }
            }
          }));
          break;
      }
    }
  };
};