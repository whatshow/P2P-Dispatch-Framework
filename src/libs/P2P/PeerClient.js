//客户端
window.ppdf.p2p.PeerClient = function(){
    var RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
    this.obj = new RTCPeerConnection(window.ppdf.config.p2p);     //p2p对象
    this.release = null;                                          //释放函数默认为空
};
/**
 * 设置释放客户端
 * @timeout         timeout 毫秒后释放this.obj
 */
window.ppdf.p2p.PeerClient.prototype.setRelease = function(timeout){
  var client = this.obj;
  
  //默认3000毫秒释放
  if(!timeout){
    timeout = 3000;
  }
  //取消之前的释放函数
  if(this.release){
    try{
      clearTimeout(this.release);
    }catch (e){}
  }
  //重新设置释放函数，准备到点释放函数
  this.release = setTimeout(function(){
    client = null;
  }, timeout);
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
};



/*** 真正P2P传输所用的客户端 ***/
/**
 * 根据描述信息寻找客户端
 */
window.ppdf.p2p.PeerClient.prototype.isDesc = function(){

};


/**
 * 准备描述对象
 */
window.ppdf.p2p.PeerClient.prototype.createOffer = function(){
  var client = this.obj;
  
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