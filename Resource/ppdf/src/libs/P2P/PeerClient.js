//客户端
window.ppdf.p2p.PeerClient = function(){
    var RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
    this.obj = new RTCPeerConnection(window.ppdf.config.p2p);
};
/**
 * 准备描述对象
 */
window.ppdf.p2p.PeerClient.prototype.startDesc = function(){
  return new Promise(function(resolve, reject){
      ppdf.p2p.client.createOffer().then(
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
 *
 */
