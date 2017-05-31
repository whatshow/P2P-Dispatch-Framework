(function() {
  if (window.ppdf) {
    window.ppdf.signal = {
      client: null,                   //客户端
      controllers: [],                     //控制器（其实都是回调函数）
      /**
       * 建立通讯
       */
      connect: function() {
        return new Promise(function(resolve, reject) {
          if (!window.ppdf.config && !window.ppdf.config.signal.server) {
            //读取配置文件失败
            reject(new window.ppdf.Utils.Error(40011, "信号服务器未配置", null));
          } else if (!window.WebSocket) {
            //不支持websocket
            reject(new window.ppdf.Utils.Error(40012, "不支持websocket", null));
          } else {
            window.ppdf.signal.client = new WebSocket(window.ppdf.config.signal.server);
            window.ppdf.signal.client.onerror = function(error) {
              window.ppdf.signal.client = null;
              reject(new window.ppdf.Utils.Error(40013, "信号服务器连接失败", error));
            };
            window.ppdf.signal.client.onclose = function(e) {
              window.ppdf.signal.client = null;
              reject(new window.ppdf.Utils.Error(40014, "信号服器连接被关闭", e));
            };
            window.ppdf.signal.client.onopen = function() {
              resolve();
            }
          }
        });
      },
      /**
       * 增加消息处理函数
       * @callback                回调函数
       */
      addController: function(callback) {
        //增加处理函数
        window.ppdf.signal.controllers.push(callback);
        //增加调用
        if (window.ppdf.signal.client) {
          window.ppdf.signal.client.onmessage = function(e) {
            var param;
            try{
              param = JSON.parse(e.data);
            }catch(e){
              param = e.data;
            }
            //执行参数
            for (var i = 0; i < window.ppdf.signal.controllers.length; i++) {
              window.ppdf.signal.controllers[i](param);
            }
          }
        }
      },
      /**
       * 删除调用
       * @index                   第index个函数，index从0开始计算
       */
      removeController: function(index) {
        if (index >= 0 && index < window.ppdf.signal.controllers.length) {
          //删除处理函数
          window.ppdf.signal.controllers.splice(index, 1);
          //重新添加绑定
          if (window.ppdf.signal.client) {
            window.ppdf.signal.client.onmessage = function(e) {
              for (var i = 0; i < window.ppdf.signal.controllers.length; i++) {
                window.ppdf.signal.controllers[i](e.data);
              }
            }
          }
        }
      },
      /**
       * 获取所有控制器
       */
      getAllControllers: function() {
        return window.ppdf.signal.controllers;
      },
      /**
       * 删除所有控制器
       */
      removeAllControllers: function() {
        window.ppdf.signal.controllers = [];
        if (window.ppdf.signal.client) {
          window.ppdf.signal.client.onmessage = function(e) {
            //不做任何处理
          }
        }
      },
      
      /**
       * 接到消息该怎么处理
       * @callback(res)                  处理返回消息函数
       */
      onMessage: function(callback) {
        if (window.ppdf.signal.client) {
          window.ppdf.signal.client.onmessage = function(e) {
            callback(e.data);
          };
        }
      },
      /**
       * 发送消息
       * @str                     发送的字符串
       */
      send: function(str) {
        
        if (!window.ppdf.signal.client || !str) {
          return false;
        } else {
          window.ppdf.signal.client.send(str);
        }
      }
    };
  }
})();