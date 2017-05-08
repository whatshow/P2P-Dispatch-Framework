//客户端类型
function Client(){
    this.obj =                  null;
    this.address =              "";       //纪录ip地址＋端口号，形如 ::ffff:xxx.xxx.xxx.xxx:xxxxxx
    this.weight =               0;
    this.urls =                 [];
}
/**
 * 获取websocket连接对象
 */
Client.prototype.getWebSocket = function(){
    return this.obj;
};
/**
 * 检查另外一个客户端是否和自己一样
 * @client          另外一个客户端、一个websocket连接、ip地址
 */
Client.prototype.match = function(param){
    var isMatch = false;

    switch(typeof param){
        //传入了ip地址
        case "string":
            if(this.address == param){
                isMatch = true;
            }
            break;
        //传入了客户端 或 websocket连接
        case "object":
            if(param == this.obj){
                //传入了websocket对象
                //匹配
                isMatch = true;
            }else if(param.obj && param.obj == this.obj){
                //传入了客户端对象（检查websocket对象）
                //匹配
                isMatch = true;
            }else if(param.address && param.address == this.address){
                //传入了客户端对象（检查地址对象）
                //匹配
                isMatch = true;
            }
            break;
    }
    //返回查询结果
    return isMatch;
};
/**
 * 添加资源
 * @url          资源路径
 */
Client.prototype.addURL = function(url){
    //资源不存在，直接结束
    if(!url){
        return;
    }
    //尝试添加数据
    var i = 0;
    if(this.urls.length <= 0){
        this.urls.push(url);
    }else{
        for(i = 0; i < this.urls.length; i++){
            //遍历后都没有找到，则添加资源
            if(i == this.urls.length - 1 && this.urls[i] != url){
                this.urls.push(url);
            }
        }
    }
};
/**
 * 获取地址
 */
Client.prototype.getAddress = function(){
    return this.address;
};

/**
 * 客户端构造函数（导出）
 * @ws              websocket连接对象
 * @weight          权重
 */
module.exports = function(ws, weight){
    var client = new Client();
    client.obj = ws;
    client.address = ws.upgradeReq.connection.remoteAddress + ":" + ws.upgradeReq.connection.remotePort;
    if(weight){
        client.weight = weight;
    }
    return client;
};