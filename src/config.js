(function(){
    if(window.ppdf){
        ppdf.config = {
          resource:{
              servlet:{
                  md5:      "md5"
              }
          },
          signal:{
              //server:   "ws://192.168.1.6:10000"
              server:   "ws://192.168.30.95:10000"
              //server:   "ws://192.168.1.6:3000"
          },
          p2p:{
              iceServers:[
                  {
                      "url":"stun:stun.l.google.com:19302"
                  },
                  {
                      "url":"turn:numb.viagenie.ca",
                      username:"webrtc@live.com",
                      credential:"muazkh"
                  }
              ]
          },
          database:{
              warning:   "数据库配置见Database.js"
          }
        };
    }
})();