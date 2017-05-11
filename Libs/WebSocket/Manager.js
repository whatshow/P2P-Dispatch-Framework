/*** 引用模块 ***/
var WebSocketServer = require("ws").Server;
var path = require("path");
var fs = require("fs");
var crypto = require('crypto');
var async = require('asyncawait/async');
var await = require('asyncawait/await');
/*** 自定义模块 ***/
var utils = require("../Utils");
var Client = require("./Type/Client");
var Resource = require("./Type/Resource");
var Response = require("./Type/Response");


//保存的数据
var global = {
  resources:  [],                                 //资源
  clients:    []                                  //保存的客户端
};
//导出对象
module.exports = {
  /**
   * 添加客户端
   * @ws
   */
  addClient: function(ws){
    var i;
    var client;
    if(global.clients.length <= 0){
      client = new Client(ws);
      global.clients.push(client);
    }else{
      for(i = 0; i < global.clients.length; i++) {
        if(global.clients[i].match(ws)){
          break;
        }else if(i == global.clients.length - 1){
          client = new Client(ws);
          global.clients.push(client);
        }
      }
    }
  },
  /**
   * 删除客户端
   * @ws
   */
  deleteClient:  function(ws){
    var i;
    //删除客户端记录
    for(i = 0; i < global.clients.length; i++) {
      if(global.clients[i].match(ws)){
        global.clients.splice(i, 1);
        break;
      }
    }
    //删除资源中的记录
    for(i = 0; i < global.resources.length; i++){
      global.resources[i].deleteClient(ws);
    }
  },
  
  /**
   * 收集资源
   * @ws              websocket连接对象
   * @datas           客户端返回的数据[{url, md5}, ..]
   */
  gatherResources:    function(ws, datas){
    var client = new Client(ws);
    var abandonResource = [];                   //抛弃的资源，因为md5不一致(形如 [url, ..])
    
    /*** 遍历获取的数据，进行检查 ***/
    async(function() {
      var i, j;
      var data;
      var resource;
      
      //循环检测数据
      for(i = 0; i < datas.length; i++){
        data = datas[i];
        //如果不是绝对路径，说明有人进行攻击，直接结束
        if(!utils.url.isAbsolute(data.url)){
          return;
        }
        
        //数据正常，看看当前服务器保存情况，再处理
        if (global.resources.length <= 0) {
          //没有任何资源
          //直接添加
          try{
            resource = await(Resource(data.url));
            
            resource.addClient(client, data.md5);
            global.resources.push(resource);
          }catch(e){
            //资源获取失败
            abandonResource.push(data.url);
          }
        }else{
          //有资源
          var existIndex = -1;
          for(j = 0; j < global.resources.length; j++){
            if(global.resources[j].match(data.url)){
              //资源存在
              existIndex = j;
              break;
            }
          }
          //根据检查结果操作
          if(existIndex > -1){
            //存在
            global.resources[existIndex].addClient(client, data.md5);
          }else{
            //不存在
            try{
              resource = await(Resource(data.url, global.resources));
              resource.addClient(client, data.md5);
              global.resources.push(resource);
            }catch(e){
              //资源获取失败
              abandonResource.push(data.url);
            }
          }
        }
      }
    })().then(function(){
      //资源添加结束，通知客户端需要丢弃的资源
      var response = Response(1001, abandonResource);
      ws.send(JSON.stringify(response));
    }).catch(function(e){
      //出错说明代码写错了
      console.log(e);
    });
  },
  
  /**
   * 寻找可以获取数据的客户端集合
   * @ws                      websocket连接
   * @urls                    资源数组[url, ..]
   */
  findClients2AcquireData:    function(ws, urls){
    console.log("*** 寻找可以获取数据的客户端集合 ***");
    console.log("接收参数");
    console.log(urls);
    console.log("当前资源情况");
    console.log(global.resources);
    
    var i, j, k;
    var notFindResources = [];
    var reqs = [];
    
    //如果请求的资源，则构造结果
    if(urls && urls.length > 0){
      //遍历资源列表，寻找资源
      if(global.resources.length <= 0){
        notFindResources = urls;
      }else{
        //遍历资源寻找客户端
        for(i = 0; i < urls.length; i++){
          for(j = 0; j < global.resources.length; j++){
            if(global.resources[j].match(urls[i])){
              //资源匹配，添加客户端
              var clients = [];
              for(k = 0; k < global.resources[j].getAllClients().length; k++){
                clients.push(global.resources[j].getClient(k).getAddress());
              }
              reqs.push({
                url:            urls[i],
                clients:        clients
              });
              
              break;
            }else if(j == global.resources.length - 1){
              //这个资源根本没有p2p资源服务器可以提供服务
              notFindResources.push(urls[i]);
            }
          }
        }
      }
    }
    
    //发送结果
    var response = new Response(1002, {reqs: reqs, notFindResources: notFindResources});
    ws.send(JSON.stringify(response));
    
    console.log("发送结果");
    console.log(response);
  },
  /**
   * 转发数据索取请求
   * @ws                      websocket连接对象
   * @address
   */
  transferDataQuery:  function(ws, address){
    console.warn("转发数据索取请求");
    var i;
    var address2Send;
    //找到发送方法
    for(i = 0; i < global.clients.length; i++){
      if(global.clients[i].match(ws)){
        address2Send = global.clients[i].getAddress();
        break;
      }
    }
    //找到接受方
    for(i = 0; i < global.clients.length; i++){
      if(global.clients[i].match(address)){
        //准备响应报文
        var msg = {
          code:               1201,
          data:{
            source:{
              address:        address2Send
            }
          }
        };
        //发送数据
        global.clients[i].obj.send(JSON.stringify(msg));
        console.log(msg);
        break;
      }
    }
  },
  
  
  /**
   * 转发请求desc
   * @ws                      websocket连接对象
   * @address                 目标地址
   * @desc                    目标描述信息
   */
  transferOfferDesc:   function(ws, address, desc){
    var i;
    var address2Send;
    //找到发送方
    for(i = 0; i < global.clients.length; i++){
      if(global.clients[i].match(ws)){
        address2Send = global.clients[i].getAddress();
        break;
      }
    }
    //找到接收方
    for(i = 0; i < global.clients.length; i++){
      //找到了
      if(global.clients[i].match(address)){
        var msg = {
          code:               1003,
          data:{
            source:{
              address:        address2Send
            },
            desc:             desc
          }
        };
        console.warn("通知另外一方的本地描述（Offer）");
        console.warn(msg);
        global.clients[i].obj.send(JSON.stringify(msg));
        break;
      }
    }
  },
  /**
   * 转发响应Desc
   * @ws                      websocket连接对象
   * @address                 目标地址
   * @desc                    目标描述信息
   */
  transferAnswerDesc: function(ws, address, desc){
    var i;
    var address2Send;
    //找到发送方
    for(i = 0; i < global.clients.length; i++){
      if(global.clients[i].match(ws)){
        address2Send = global.clients[i].getAddress();
        break;
      }
    }
    //找到接收方
    for(i = 0; i < global.clients.length; i++){
      //找到了
      if(global.clients[i].match(address)){
        var msg = {
          code:               1004,
          data:{
            source:{
              address:        address2Send
            },
            desc:             desc
          }
        };
        console.warn("通知另外一方的描述（Answer）");
        console.warn(msg);
        global.clients[i].obj.send(JSON.stringify(msg));
        break;
      }
    }
  },
  /**
   * 转发候选信息
   * @ws                目标
   * @address
   * @iceCandidate
   */
  transferIceCandidate: function(ws, address, iceCandidate){
    console.error("转发候选信息");
    var i;
    var address2Send;               //需要发送给对方的地址
    //找到请求方的地址
    for(i = 0; i < global.clients.length; i++){
      if(global.clients[i].match(ws)){
        address2Send = global.clients[i].getAddress();
        break;
      }
    }
    //找到对方
    for(i = 0; i < global.clients.length; i++){
      if(global.clients[i].match(address)){
        //构造信息
        var msg = {
          code:         1005,
          data:{
            source:{
              address:  address2Send
            },
            candidate:    iceCandidate
          }
        };
        //发送
        global.clients[i].obj.send(JSON.stringify(msg));
        console.log("通知对方候选信息");
        console.log(msg);
        break;
      }
    }
  },
  
  
  
  /**
   * 检查是否存在提供资源的人
   * @ws                      websocket连接对象
   * @address                 地址
   * @url                     资源绝对路径
   */
  checkProvider:      function(ws, address, url){
    var i;
    var client = null;
    if(global.clients.length <= 0){
      //没有提供者，资源不存在
      ws.send(100304, null);
    }else{
      //尝试寻找客户端
      for(i = 0; i < global.clients.length; i++) {
        if (global.clients[i].match(address)) {
          client = global.clients[i];
          break;
        }
      }
      if(!client){
        ws.send(100304, null);
      }
    }
  },
  /**
   * 转发资源情况
   * @ws              客户端响应对象
   */
  tranmitResponse:    function(){
  
  },
};