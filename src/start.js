(function() {
  /*** 全局变量 ***/
  var global = {
    // 索引对象
    catalog: {},
    // url 数组
    urls: []
  };
  
  /*** DOM加载完立刻执行 ***/
  window.ppdf.DomReady.ready(function() {
    console.log("DOM ready， 可以开展框架");

    //如果不支持文件操作，则回退到传统模式
    if (!window.ppdf.Utils.file.isSupported()) {
      console.log("不支持文件操作，则回退到传统模式");
      window.ppdf.DOMManager.resetAllResource();
      return;
    }
    
    //如果不支持ajax，则回退到传统模式
    if (!window.ppdf.ajax.check()) {
      console.log("不支持ajax，则回退到传统模式");
      window.ppdf.DOMManager.resetAllResource();
      return;
    }
    
    //如果信令服务器连接失败，则回退到传统模式
    window.ppdf.signal.connect().then(function() {
      //信令服务器服务器连接成功
      console.log("信令服务器服务器连接成功");
      //数据库尝试初始化
      return window.ppdf.database.initDB();
    }).then(function() {
      console.log("数据库初始化成功");
      return window.ppdf.p2p.check();
    }).then(function() {
      console.log("支持p2p");
      window.ppdf.p2p.PeerClientPool.init();
      return ppdf.database.getAllData();
    }).then(function(catalog) {
      console.log("获取本地目录");
      console.log(catalog);
      global.catalog = catalog;
      var msg = {
        code:   3001,
        data:   catalog
      };
      window.ppdf.signal.send(JSON.stringify(msg));
      console.log("通知远程服务器");
      console.log(msg);
      console.log("进入等待状态");
      //注册回调
      window.ppdf.signal.addController(function(res) {
        switch(parseInt(res.code)){
            case 1001:
              console.log("1001 准备丢弃资源");
              console.log(res.data);
              //过滤目录
              res.data.forEach(function(url) {
                  window.ppdf.database.deleteData(url);
                  global.catalog = global.catalog.filter(function(one) {
                      return one.url !== url;
                  })
              });
              //设置本地资源
              global.catalog.forEach(function(one) {
                  window.ppdf.database.getData(one.url).then(function(res) {
                      window.ppdf.DOMManager.replacePageResource(res.url, res.data);
                  });
              });
              //没有的资源通知服务器
              window.ppdf.DOMManager.collectPageResource(function(data) {
                var msg = {
                  code: 3002,
                  data: data.map(function(one) {
                    return one.url
                  })
                };
                console.log("向服务器发送报文");
                console.log(msg);
                window.ppdf.signal.send();
              });
              break;
        }
        // switch (parseInt(res.code)){
        //     case 1002:
        //       console.warn("1002");
        //       console.log(res);
        //
        //       res.data.notFindResources.forEach(function(url) {
        //           window.ppdf.ajax.acquireBlob(url).then(function(ajax) {
        //               //获取数据
        //               var data = ajax.response;
        //               var md5 = ajax.getResponseHeader("md5");
        //               var url = ajax.responseURL;
        //               //把资源添加到dom
        //               window.ppdf.DOMManager.replacePageResource(url, data);
        //               //把数据写入数据库
        //               window.ppdf.database.addData({ url: url, md5: md5, data: data });
        //               //修改本地数据索引
        //               global.catalog.push({ url: url, md5: md5 });
        //               //通知信令服务器增加资源
        //               window.ppdf.signal.send({
        //                   code:     3204,
        //                   data:{
        //                       url:    url,
        //                       md5:    md5
        //                   }
        //               });
        //           });
        //           //p2p组装资源　
        //           res.data.reqs.forEach(function(one) {
        //               window.ppdf.p2p.Mission(one.url, '', one.clients, function(blob) {
        //                   window.ppdf.DOMManager.replacePageResource(one.url, blob);
        //                   //计算md5
        //                   var md5 = window.ppdf.file.md5(window.ppdf.file.blob2binary(blob));
        //                   //把数据写入数据库
        //                   window.ppdf.database.addData({ url: one.url, md5: md5, data: blob });
        //                   //修改本地数据索引
        //                   global.catalog.push({ url: one.url, md5: md5 });
        //                   //通知信令服务器增加资源
        //                   window.ppdf.signal.send({
        //                       code:     3204,
        //                       data:{
        //                           url:    one.url,
        //                           md5:    md5
        //                       }
        //                   });
        //               }, function() {
        //                   window.ppdf.DOMManager.onResourceLoadFailed(one.url);
        //               });
        //           })
        //
        //       });
        //       break;
        // }
      });
    }).catch(function(error) {
      switch (error.code) {
        //数据库失败
        case 40031:
        case 40032:
        //P2P 检测失败
        case 40021:
        //信令服务器连接失败
        case 4011:
        case 4012:
        case 4013:
        case 4014:
          break;
      }

      console.error(error);
      
      //所有错误都执行这段代码
      //回退到传统模式
      window.ppdf.DOMManager.resetAllResource();
    });
  });
})();