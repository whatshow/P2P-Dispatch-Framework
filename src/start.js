(function(){
    /*** 立刻执行的操作 ***/
    //变量
    var sources;                                                        //dom树中所有资源
    var resourceCatalog = {
        obj:                    null,                                   //资源索引
        maybeUpdate:            [],                                     //可能要更新的
        needDownload:           []                                      //需要下载的（含需要更新的）
    };

    //p2p客户端
    var p2pClient = window.ppdf.p2p.test.getClient();
    var needResourceURL;                                                //需要的资源路径
    var targetAddress;
    var sendChannel;
    var receiveChannel;
    //收到候选信息后执行的操作
    p2pClient.onicecandidate = function(e) {
      //如果构造出来了候选客户端，则发送
      if(e.candidate){
        console.warn("目标地址");
        console.log(targetAddress);
        console.warn("发送候选信息");
        //console.log(e.candidate);
        //构造信息
        var msg = {
          code:                 3005,
          data:{
            target: {
              address:          targetAddress
            },
            candidate:          e.candidate
          }
        };
        //发送
        window.ppdf.signal.send(JSON.stringify(msg));
        console.log(msg);
      }
    };


    //接受信号时该如何处理
    function OnSignal(txt){
        var i, j, k, l, m, n;
        var url;
        var array;
        var server;
        var source;
        var attribute;

        var data;
        var md5;

        var res = JSON.parse(txt);
        //根据返回码操作
        switch(res.code){
            //丢弃资源
            case 1001:
                console.log("服务器指令1001");
                console.log(res.data);
                /*** 操作目录 ***/
                //1.丢弃本地这些资源
                ppdf.Utils.loop(res.data, function(index, url, next){
                    //删除资源
                    ppdf.database.deleteData(url).then(function(){
                        next();
                    }).catch(function(e){
                        next();
                    });
                });
                //2.根据返回结果，去除内存目录中的数据
                for(i = 0; i < res.data.length; i++){
                    for(j = 0; j < resourceCatalog.obj.length; j++){
                        //删除目录中丢失的资源
                        if(resourceCatalog.obj[j].url == res.data[i].url){
                            resourceCatalog.obj.splice(j, 1);
                            break;
                        }
                    }
                }
                /*** 获取当前页面中 可能需要下载 & 需要下载的资源 ***/
                //目录中不存在，则视为需要下载；存在，视为可能需要下载
                for(i = 0; i < sources.length; i++) {
                    url = sources[i].src || sources[i].value || sources[i].data;
                    //比对文件
                    if(resourceCatalog.obj.length <= 0){
                        //本地不存在缓存，所有文件都需要下载
                        resourceCatalog.needDownload.push(url);
                    }else{
                        //本地存在缓存，挨个检查
                        for(j = 0; j < resourceCatalog.obj.length; j++){
                            if(url == resourceCatalog.obj[j].url){
                                //资源本地存在缓存，可能需要下载
                                resourceCatalog.maybeUpdate.push(url);
                                break;
                            }else if(j == resourceCatalog.obj.length - 1){
                                //资源本地不存在，需要下载
                                resourceCatalog.needDownload.push(url);
                            }
                        }
                    }
                }

                //获取列表完毕，去除重复项目
                ppdf.Utils.url.removeSame(resourceCatalog.maybeUpdate);
                ppdf.Utils.url.removeSame(resourceCatalog.needDownload);
                //去除无法获取服务器的项目
                for(i = 0; i < resourceCatalog.maybeUpdate.length; i++){
                    server = ppdf.Utils.url.getServer(resourceCatalog.maybeUpdate[i]);
                    if(!server){
                        resourceCatalog.maybeUpdate.splice(i, 1);
                        i--;
                    }
                }
                for(i = 0; i < resourceCatalog.needDownload.length; i++){
                    server = ppdf.Utils.url.getServer(resourceCatalog.needDownload[i]);
                    if(!server){
                        resourceCatalog.needDownload.splice(i, 1);
                        i--;
                    }
                }
                console.log("资源目录");
                console.log(resourceCatalog);

                //循环检查可能需要更新列表：与资源服务器通讯检查md5，检查是否需要更新
                array = resourceCatalog.maybeUpdate;
                ppdf.Utils.loop(array, function(index, url, next){
                    var server = ppdf.Utils.url.getServer(url);
                    var servlet_md5 = ppdf.Utils.url.getServletAbsolutePath(server, ppdf.config.resource.servlet.md5);
                    ppdf.ajax.get(servlet_md5 + "?url=" + url, "json").then(function(res){
                        //检查md5，如果本地存储不一致，则把这个url添加到需要下载的路径
                        for(i = 0; i < resourceCatalog.obj.length; i++){
                            //找到这个元素执行操作
                            if(resourceCatalog.obj[i].url == url){
                                if(resourceCatalog.obj[i].md5 != res.data.md5){
                                    //md5不一致，则添加到下载列表
                                    resourceCatalog.needDownload.push(url);
                                }else{
                                    //md5一致，则直接显示
                                    console.log("直接显示的数据" + url);
                                    data = ppdf.database.getData(url).then(function(res){
                                        var i;
                                        var localurl;
                                        //本地读取成功
                                        //把数据显示出来
                                        //显示界面
                                        data = window.URL.createObjectURL(res.data);
                                        //找到source
                                        for(i = 0; i < sources.length; i++){
                                            localurl = sources[i].src || sources[i].value || sources[i].data;
                                            if(sources[i].src){
                                                attribute = "src";
                                            }
                                            if(sources[i].value){
                                                attribute = "value";
                                            }
                                            if(sources[i].data){
                                                attribute = "data";
                                            }
                                            if(localurl == url){
                                                sources[i].obj.setAttribute(attribute, data);
                                            }
                                        }
                                    }).catch(function(e){
                                        //本地读取失败
                                        //把这个资源添加到下载列表
                                        resourceCatalog.needDownload.push(url);
                                    });
                                }
                                break;
                            }
                        }
                        next();
                    }).catch(function(error){
                        //获取不到md5值，把这个资源添加到下载列表
                        resourceCatalog.needDownload.push(url);
                        next();
                    });
                }).then(function(){
                    //所有需要下载的资源配置完毕
                    console.log("所有需要下载的资源配置完毕");
                    console.log(resourceCatalog);
                    //清空可能需要下载目录
                    resourceCatalog.maybeUpdate = [];
                    //询问服务器是否有客户端可提供下载
                    var msg = {
                        code:               3002,
                        data:               resourceCatalog.needDownload
                    };
                    ppdf.signal.send(JSON.stringify(msg));
                    console.log("询问服务器是否有资源可以下载");
                    console.log(msg);
                });

                break;
            //收到可用的客户端
            case 1002:
                console.log("服务器指令1002");
                console.log(res.data);
                /*** 无法P2P提供的资源需要ajax下载 ***/
                for(i = 0; i < res.data.notFindResources.length; i++){
                    ppdf.ajax.acquireBlob({
                        url:            res.data.notFindResources[i],
                        callbackParam:  "ajax",
                        success:        function(ajax){
                            //保存数据
                            md5 = ajax.getResponseHeader("md5");
                            url = ajax.responseURL;
                            if(md5 && url){
                                data = ajax.response;
                                ppdf.database.addData({url: url, md5: md5, data: data});
                            }

                            //显示界面
                            data = window.URL.createObjectURL(ajax.response);
                            //找到source
                            for(i = 0; i < sources.length; i++){
                                //console.log(sources);
                                url = sources[i].src || sources[i].value || sources[i].data;
                                if(sources[i].src){
                                    attribute = "src";
                                }
                                if(sources[i].value){
                                    attribute = "value";
                                }
                                if(sources[i].data){
                                    attribute = "data";
                                }
                                if(url == ajax.responseURL){
                                    sources[i].obj.setAttribute(attribute, data);
                                }
                            }
                        }
                    });
                }
                /*** P2P可用的资源找对应的客户端要下载 ***/
                //把对应的资源询问
                // for(i = 0; i < res.data.reqs.length; i++){
                //
                // }
                //如果不够则不发送
                if(res.data.reqs.length <= 0){
                  return;
                }
                
                //向对方发送索取数据请求
                var msg = {
                  code:       3201,
                  data: {
                    target: {
                      address: res.data.reqs[0].clients[0]
                    }
                  }
                };
                window.ppdf.signal.send(JSON.stringify(msg));
                console.warn("发送数据索取请求");
                console.log(msg);
                break;
            //收到请求描述信息
            case 1003:
                //保存请求地址
                targetAddress = res.data.source.address;
              
                //构建接受通道
                p2pClient.ondatachannel = function(e) {
                  //保存数据通道
                  receiveChannel = e.channel;
                  receiveChannel.binaryType = 'arraybuffer';
                  receiveChannel.onmessage = function(e){
                    //console.log(e);
                    console.warn("接收到p2p数据");
                    var blob = new Blob([event.data]);
                    var data = window.URL.createObjectURL(blob);
                    //找到source
                    sources[0].obj.setAttribute('src', data);
                  }
                };
              
                //保存描述
                window.ppdf.p2p.test.answerDesc(p2pClient, res.data.desc).then(function(desc){
                  console.warn("响应描述");
                  console.log(desc.sdp);
                  //把对应的p2p客户端发送到服务器
                  var msg = {
                    code:           3004,
                    data: {
                      target:{
                        address:    res.data.source.address
                      },
                      desc:         desc
                    }
                  };
                  window.ppdf.signal.send(JSON.stringify(msg));
                  console.warn("发送响应描述");
                  console.warn(msg);
                  console.log("提供者");
                  console.log(p2pClient);
                }).catch(function(e){
                  console.error("保存描述信息错误");
                  console.error(e);
                });
                break;
            //收到响应描述
            case 1004:
                console.warn("接收到响应描述");
                //保存响应描述
                window.ppdf.p2p.test.storeRemoteAnswerDesc(p2pClient, res.data.desc).then(function(){
                  console.log("成功");
                  console.log(p2pClient);
                });
                break;
            //收到候选信息
            case 1005:
                console.warn("*****接收到候选信息");
                console.log(res.data.candidate);
                //把icecandidate添加到自己
                p2pClient.addIceCandidate(res.data.candidate);
                break;
            //收到数据索取请求
            case 1201:
                //保存目标地址
                targetAddress = res.data.source.address;
              
                //发起p2p请求
                //建立数据传输通道
                sendChannel = p2pClient.createDataChannel('sendDataChannel');
                sendChannel.binaryType = 'arraybuffer';
                sendChannel.onopen = function(e){
                  var readyState = sendChannel.readyState;
                  if (readyState === 'open') {
                    console.error("准备发送数据");
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
                
                console.log("创建数据通道");
                console.log(sendChannel);
                //构建发起描述
                window.ppdf.p2p.test.startDesc(p2pClient).then(function(desc){
                    console.warn("请求描述");
                    console.log(desc.sdp);
                    //把对应的p2p客户端发送到服务器
                    var msg = {
                      code:           3003,
                      data: {
                        target:{
                          address:    res.data.source.address
                        },
                        desc:         desc
                      }
                    };
                    window.ppdf.signal.send(JSON.stringify(msg));
                    console.warn("发送本地描述");
                    console.warn(msg);
                }).catch(function(e){
                    console.error('p2p通讯故障');
                    console.error(e);
                });
                break;
        }
    }


    //如果支持文件操作，则尝试展开PPDF框架
    if(window.ppdf.Utils.file.isSupported()){
        /*** dom ready执行操作 ***/
        ppdf.DomReady.ready(function(){
            //中断所有数据的加载
            sources = ppdf.Utils.getReloadSources();
            ppdf.Utils.cutDefaultLoad(sources);
            //初始化ajax
            ppdf.ajax.init().then(function(){
                console.log("ajax，初始化成功；尝试连接信号服务器，准备开始加速传输");
                //ajax，初始化成功；尝试连接信号服务器，准备开始加速传输
                return ppdf.signal.connect();
            }).then(function(){
                console.log("信号服务器连接成功，注册接受函数");
                //信号服务器连接成功，注册接受函数
                ppdf.signal.onMessage(OnSignal);
                //检查P2P
                console.log("检查p2p");
                return ppdf.p2p.check();
            }).then(function(){
                //尝试开启本地数据库存储
                return ppdf.database.initDB();
            }).then(function(){
                //数据库开启成功，获取所有数据（目录结构）
                return ppdf.database.getAllData();
            }).then(function(catalog){
                if(!catalog){
                    //此时发生数据读取错误，则开启恢复传统加载模式
                    ppdf.Utils.recoverDefaultLoad(sources);
                }else{
                    //保存资源索引
                    resourceCatalog.obj = catalog;
                    //通知信号服务器本地存储情况
                    var msg = {
                        code:               3001,
                        data:               catalog
                    };
                    ppdf.signal.send(JSON.stringify(msg));
                    //
                    console.log("*** 通知服务器本地资源情况 ***");
                    console.log(msg);
                    console.log("*** 通知服务器本地资源情况 ***");
                }
            }).catch(function(error){
                console.log("*** 发生错误 ***");
                console.log(error);
                console.log("*** 发生错误 ***");

                //根据错误码操作
                switch(error.code){
                    case 40011:
                    case 40012:
                    case 40013:
                    case 40014:
                        //信号服务器无法正常通讯，恢复传统加载模式
                        ppdf.Utils.recoverDefaultLoad(sources);
                        console.log(error);
                        break;
                    case 40021:
                        //P2P传输无法开启，恢复传统加载模式
                        ppdf.Utils.recoverDefaultLoad(sources);
                        console.log(error);
                        break;
                    case 40031:
                        return;
                    case 40032:
                        //出现数据库无法打开 或 数据库升级失败的情况，恢复传统加载模式
                        ppdf.Utils.recoverDefaultLoad(sources);
                        console.log(error);
                        break;
                    case 40033:
                    case 40034:
                    case 40035:
                        break;
                    case 40041:
                    case 40042:
                        //ajax无法开启，恢复传统加载模式
                        ppdf.Utils.recoverDefaultLoad(sources);
                        console.log(error);
                        break;
                }
            });
        });
    }
})();