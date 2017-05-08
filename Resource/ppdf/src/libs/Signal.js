(function(){
    if(window.ppdf){
        window.ppdf.signal = {
            client:                     null,                   //客户端
            /**
             * 建立通讯
             */
            connect:    function(){
                return new Promise(function(resolve, reject){
                    if(!window.ppdf.config && !window.ppdf.config.signal.server){
                        //读取配置文件失败
                        reject(new window.ppdf.Utils.Error(40011, "信号服务器未配置", null));
                    }else if(!window.WebSocket){
                        //不支持websocket
                        reject(new window.ppdf.Utils.Error(40012, "不支持websocket", null));
                    }else{
                        window.ppdf.signal.client = new WebSocket(window.ppdf.config.signal.server);
                        window.ppdf.signal.client.onerror = function(error) {
                            reject(new window.ppdf.Utils.Error(40013, "信号服务器连接失败", error));
                        };
                        window.ppdf.signal.client.onclose = function(e) {
                            reject(new window.ppdf.Utils.Error(40014, "信号服器连接被关闭", e));
                        };
                        window.ppdf.signal.client.onopen = function(){
                            resolve();
                        }
                    }
                });
            },
            /**
             * 接到消息该怎么处理
             * @callback(res)                  处理返回消息函数
             */
            onMessage:   function(callback){
                if(window.ppdf.signal.client){
                    window.ppdf.signal.client.onmessage = function(e){
                        callback(e.data);
                    };
                }
            },
            /**
             * 发送消息
             * @str                     发送的字符串
             */
            send:   function(str){
                if(!window.ppdf.signal.client || !str || typeof str != 'string'){
                    return false;
                }else{
                    window.ppdf.signal.client.send(str);
                }
            }
        };
    }
})();