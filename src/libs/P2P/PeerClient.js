/**
 * 客户端
 * @live 生存时间，默认3000ms
 */
window.ppdf.p2p.PeerClient = function(live){
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
 */
window.ppdf.p2p.PeerClient.prototype.releaseImmediately = function(){
  //释放p2p客户端
  this.obj = null;
  //释放任务
  //如果有任务，则执行任务的失败回调
  if(this.mission){
    this.mission.fail();
  }
  //释放目标地址
  this.targetAddress = null;
  //释放时间戳
  this.timestamp = null;
};
/**
 * 中断释放客户端
 */
window.ppdf.PeerClient.prototype.cutRelease = function(){
  //取消之前的释放函数
  if(this.release){
    try{
      clearTimeout(this.release);
    }catch (e){}
    this.release = null;
  }
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
  return timestamp == this.timestamp ? true : false;
};

/**
 * 目标地址是否匹配
 * @targetAddress   目标地址
 */
window.ppdf.p2p.PeerClient.prototype.hasTargetAddress = function(targetAddress){
  if(this.targetAddress == targetAddress){
    return true;
  }else{
    return false;
  }
};
/**
 * 绑定目标
 * @targetAddress     对方地址
 */
window.ppdf.p2p.PeerClient.prototype.bindTarget = function(targetAddress){
  this.targetAddress = targetAddress;
};


/**
 * 准备描述对象
 */
window.ppdf.p2p.PeerClient.prototype.createOffer = function(){
  var client = this.obj;
  //构造发送通道
  
  //返回promise对象
  return new Promise(function(resolve, reject){
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
  
  
  //返回promise对象
  return new Promise(function(resolve, reject){
    client.setRemoteDescription(desc);
    client.createAnswer().then(
      function(desc){
        //保存desc
        client.setLocalDescription(desc);
        //进入下一个状态
        resolve(desc);
      },
      function onCreateSessionDescriptionError(error){
        reject(new ppdf.Utils.Error(40023, "发起连接请求失败", error));
      }
    );
  });
};
/**
 * 保存响应描述
 * @desc              描述信息
 */
window.ppdf.p2p.PeerClient.prototype.storeAnswerDesc = function(desc){
  this.obj.setRemoteDescription(desc);
};
/**
 * 注入候选信息时回调
 * @callback(icecandidate)     回调
 */
window.ppdf.p2p.PeerClient.prototype.setOnIceCandidate = function(callback){
  this.obj.onicecandidate = function(e) {
    if(e.candidate){
      callback(this, e.candidate);
    }
  };
};