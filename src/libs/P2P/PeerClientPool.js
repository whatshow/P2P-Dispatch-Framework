/**
 * PeerClientPool
 * 使用注意
 */

(function() {
  var NO_LIMIT_MISSIONQUEUE = -1;                 //不限制任务队列长度
  
  
  //配置
  var setting = {
    peerClientLive:           3000,               //一个客户端默认生成3000ms
    maxPeerClients:           10,                 //客户度最大数量
  
    //最大任务数量
    maxMissions:              NO_LIMIT_MISSIONQUEUE
    
  };
  
  //任务队列
  var missionQueue = [];
  //P2P客户端池（形如 [{peerclient, release },  ...] ）一个客户端，一个释放函数
  var pool = [];
  
  
  //p2p线程池
  window.ppdf.p2p.PeerClientPool = {
    /**
     * 初始化（只有信令服务器开启时才能打开）
     */
    init: function(){
      //增加控制器
      window.ppdf.signal.addController(function(res){
        switch(parseInt(res.code)){
          //收到请求描述信息
          case 1003:
            break;
          //收到响应描述
          case 1004:
            break;
          //收到候选信息
          case 1005:
            break;
          //接收到发送数据请求，准备发送数据
          case 1201:
            break;
        }
      });
      //初始化
    },
    /**
     * 增加一个任务
     * @mission           任务
     */
    addMission: function(mission){
      //先寻找空闲客户端
      var client = window.ppdf.p2p.PeerClientPool.findUsefulClient();
      //如果没有空闲的，则尝试构造
      if(!client){
        client = window.ppdf.p2p.PeerClientPool.addClient();
      }
      //如果构造失败，则说明任务并发达到最高，则把任务添加到队列
      if(!client){
        if(setting.maxMissions == NO_LIMIT_MISSIONQUEUE){
          //不限制队列长度，直接添加
          missionQueue.push(mission);
          return true;
        }else if(missionQueue.length >= setting.maxMissions){
          //队列长度满了，丢弃任务
          return false;
        }else{
          //任务队列不满，则将任务放到任务队列中
          missionQueue.push(mission);
          return true;
        }
      }
      //执行到此说明客户端构造成功
      
      return true;
    },
    
    /**
     * 执行任务（尝试建立连接，连接建立成功，则开始执行传输）
     * @client                客户端
     * @mission               任务
     */
    doMission:  function(client, mission){
    
    },
    
    
    /*** 被调用的方法 ***/
    /**
     * 新增一个客户度
     */
    addClient:  function(){
      //增加客户端数量不能超出池容量
      if(pool.length < setting.maxPeerClients){
        var client = new window.ppdf.p2p.PeerClient();
        //经过一定时间释放客户端
        client.setRelease(setting.peerClientLive);
        //增加
        pool.push(client);
        //成功
        return client;
      }else{
        return null;
      }
    },
    /**
     * 寻找可用客户端
     */
    findUsefulClient: function(){
      for(var i = 0; i < pool.length; i ++){
        if(pool[i].isEmpty()){
          //找到了
          pool[i].rebuild();
          //经过一定时间释放客户端
          pool[i].setRelease(setting.peerClientLive);
          return pool[i];
        }else if(i == pool.length - 1){
          //什么都没有找到，返回null
          return null;
        }
      }
    }
  };
})();