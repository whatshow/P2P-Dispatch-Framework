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
  //释放p2p客户端
  try{
    this.obj.close();
  }catch(e){}
  this.obj = null;
  
  //释放任务
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
 * @targetAddress     对方地址
 */
window.ppdf.p2p.PeerClient.prototype.bindTargetAddress = function(targetAddress){
  this.targetAddress = targetAddress;
};


/**
 * 准备描述对象
 */
window.ppdf.p2p.PeerClient.prototype.createOffer = function(){
  var client = this.obj;
  //构造发送通道
  var sendChannel = client.createDataChannel('sendDataChannel');
  sendChannel.binaryType = 'arraybuffer';
  sendChannel.onopen = function(e){
    var readyState = sendChannel.readyState;
    if (readyState === 'open') {
      window.ppdf.database.getData("http://192.168.50.158:10000/img/1.jpeg").then(function(dbRes){
        console.log(dbRes);
        //转成二进制发送
        window.ppdf.Utils.file.blob2binary(dbRes.data).then(function(binaryData){
          sendChannel.send(binaryData);
        });
      });
    }
  };
  sendChannel.onclose = function(e){
    var readyState = sendChannel.readyState;
  };
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
 * 响应描述
 * @desc
 */
window.ppdf.p2p.PeerClient.prototype.answerDesc = function(desc){
  var client = this.obj;
  //构造接收通道
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
      //释放客户端
      client.releaseImmediately(blob);
    }
  };
  
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
                address:    this.targetAddress
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
                address:    this.targetAddress
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