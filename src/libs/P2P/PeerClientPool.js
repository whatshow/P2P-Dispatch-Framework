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
  //P2P客户端池，形如 [peerclient,  ...]
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
          //收到提供描述信息
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
            window.ppdf.p2p.PeerClientPool.transfer(res.data).catch(function(e){
              console.log(e);
            });
            break;
          //接收到拒绝服务，准备使用下一个提供者
          case 1202:
            window.ppdf.p2p.PeerClientPool.tryNextProvider(res.data);
            break;
          //接收到终止请求，释放用于发送数据的客户端
          case 1203:
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
      //执行到此说明客户端构造成功，则把任务绑定到客户端中
      client.setOnIceCandidate(function(candidate){
        //在
      });
      window.ppdf.p2p.PeerClientPool.doMission(client, mission);
      return true;
    },
    
    /*** 被调用的方法 ***/
    /**
     * 执行任务（尝试建立连接，连接建立成功，则开始执行传输）
     * @client                客户端
     * @mission               任务（不传递表示再次执行任务）
     */
    doMission:  function(client, mission){
      //检查传递的参数
      if(!mission){
        //如果没有设置任务，则采用client自己的任务
        mission = client.getMission();
      }else{
        //有任务则设置任务
        client.setMission(mission);
      }
      //如果依旧没有任务，则说明本身就没有任务，直接结束
      if(!mission){
        return;
      }
    
      //执行到此说明一切准备就绪，开始发送数据索取请求
      //中断释放过程：如果中断失败，则说明客户端已经释放过了，已经触发了任务失败
      if(client.cutRelease()){
        //执行到此说明中断成功，则返回结果
        var address = mission.getNextProviderAddress();
        window.ppdf.signal.send(JSON.stringify({
          code:   3201,
          data:   {
            offer:  {
              //IP地址
              address:    address
            },
            answer: {
              //时间戳
              timestamp:  client.getTimestamp()
            }
          }
        }));
        //绑定地址
        client.bindTargetAddress(address);
        //开始客户端对象释放计算时间
        client.setRelease();
      }
    },
    /**
     * 根据desc寻找PeerClient
     * @desc                  描述信息
     */
    findPeerClientByDesc: function(desc){
      for(var i = 0; i < pool.length; i++){
        if(pool[i].hasLocalDesc(desc)){
          return pool[i];
        }else if(i == pool.length - 1){
          return null;
        }
      }
    },
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
          //找到了空闲的客户度，则重新激活，并返回这个客户端给
          pool[i].rebuild();
          return pool[i];
        }else if(i == pool.length - 1){
          //什么都没有找到，返回null
          return null;
        }
      }
    },
    
    /*** 接收到消息的回调 ***/
    /**
     * 开启传输（客户端是新建出来，不用中止释放）
     * @data            websocket返回对象中的data字段
     */
    transfer: function(data){
      return new Promise(function(resolve, reject){
        //先寻找空闲客户端
        var client = window.ppdf.p2p.PeerClientPool.findUsefulClient();
        //如果没有空闲的，则尝试构造
        if(!client){
          client = window.ppdf.p2p.PeerClientPool.addClient();
        }
        //如果构造失败，则说明任务并发达到最高，则拒绝本次传输
        if(!client){
          reject(window.ppdf.Error(40022, "拒绝提供数据传输服务（本地线程并发达到最高，再并发影响效率）", null));
          //通知失败
          data.offer.isAvailable = false;
          window.ppdf.signal.send(JSON.stringify({
            code:             3202,
            data:             data
          }));
          return;
        }
        
        //执行到此说明，可用获取到一个可用的客户端
        //绑定对方地址
        client.bindTargetAddress(data.answer.address);
        //构造提供描述
        client.createOffer().then(function(desc){
          //配置描述 & 时间戳
          data.offer.desc = desc;
          data.offer.timestamp = client.getTimestamp();
          //发送提供描述
          window.ppdf.signal.send(JSON.stringify({
            code:             3202,
            data:             data
          }));
        }).catch(function(e){
          //构造描述对象失败
          reject(window.ppdf.Error(40023, "构造提供描述失败", e));
          //通知拒绝服务
          data.offer.isAvailable = false;
          window.ppdf.signal.send(JSON.stringify({
            code:             3202,
            data:             data
          }));
        });
      });
    },
    /**
     * 尝试下一个提供者（执行速度快，不用释放）
     * @data                websocket返回对象中的data字段
     */
    tryNextProvider:  function(data){
      var i;
      //找到这个客户端
      var timestamp = data.answer.timestamp;
      var client;
      for(i = 0; i < pool.length; i++){
        if(pool[i].hasTimestamp(timestamp)){
          client = pool[i];
          break;
        }
      }
      
      //如果没有找到这个客户端，说明客户端已经释放了，则忽略这个消息且执行下个任务
      if(!client){
        //寻找可用的客户端
        client = window.ppdf.p2p.PeerClientPool.findUsefulClient();
        //如果没有空闲的，则尝试新增
        if(!client){
          client = window.ppdf.p2p.PeerClientPool.addClient();
        }
        //如果还是获取不到客户端，则本次转台结束
        if(!client){
          //结束
          return;
        }
        //执行到此说明找到了一个可用的客户端，则尝试执行下个任务
        var mission = missionQueue.shift();
        if(mission){
          window.ppdf.p2p.PeerClientPool.doMission(client, mission);
          //结束
          return;
        }
      }
      
      //执行到此说明遮脸连接还没有释放，重新执行本次任务
      window.ppdf.p2p.PeerClientPool.doMission(client);
    },
    /**
     * 收到终止数据请求
     * @data          websocket返回对象中的data字段
     */
    onTerminatingDateRequest: function(data){
      var i;
      //找到匹配offer的client
      var client;
      for(i = 0; i < pool.length; i++){
        if(pool[i].hasTimestamp(data.offer.timestamp)){
          client = pool[i];
          break;
        }
      }
      //如果没有找到，说明客户端已经被释放掉了,直接结束
      if(!client){
        return;
      }
      
      //执行到此说明找到了，则立刻释放本地客户端
      client.releaseImmediately();
    },
    /**
     * 收到提供描述
     * @data          websocket返回对象中的data字段
     */
    onOfferDesc:  function(data){
      var i;
      
      //寻找到本地的客户端
      var client;
      for(i = 0; i < pool.length; i++){
        if(pool[i].hasTimestamp(data.answer.timestamp)){
          client = pool[i];
          break;
        }
      }
      //如果没有找到客户端，说明这个连接已经被释放了，不再处理
      if(!client){
        return;
      }
      
      //执行到此说明一切正常，则开始响应
      //中断释放过程：如果中断失败，则说明客户端已经释放过了，已经触发了任务失败
      if(client.cutRelease()){
        client.answerDesc(data.offer.desc).then(function(){
          //响应描述成功
          data.answer.desc = desc;
          window.ppdf.signal.send(JSON.stringify({
            code:       3004,
            data:       data
          }));
          client.setRelease();                                  //重新开始等待释放
        }).catch(function(e){
          //创建描述失败
          //发出终止数据请求
          data.answer.isAvailable = false;
          window.ppdf.signal.send(JSON.stringify({
            code:       3203,
            data:       data
          }));
          //尝试下一个数据提供者
          window.ppdf.p2p.PeerClientPool.doMission(client);
          client.setRelease();                                  //重新开始等待释放
        });
      }
    },
    /**
     * 收到响应描述
     * @data          websocket返回对象中的data字段
     */
    onAnswerDesc: function(data){
    
    },
    /**
     * 收到候选信息
     * @data          websocket
     */
    onCandidate:  function(data){
    
    }
  };
})();