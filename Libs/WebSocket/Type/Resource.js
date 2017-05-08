/*** 自定义模块 ***/
var utils = require("../../Utils");

//资源类
function Resource(){
    this.url = "";
    this.md5 = "";
    this.clients = [];
}
/**
 * 匹配
 * @input       resource对象 或 url字符串
 */
Resource.prototype.match = function(input){
    switch(typeof input){
        case "string":
            if(input == this.url){
                //是同一个资源
                return true;
            }else{
                //不是同一个资源
                return false;
            }
            break;
        case "object":
            if(!input.url){
                //不是同一个资源
                return false;
            }else if(input.url == this.url){
                //是同一个资源
                return true;
            }else{
                //不是同一个资源
                return false;
            }
            break;
        default:
            //其它情况，不匹配
            return false;
    }
};
/**
 * 获取url
 */
Resource.prototype.getURL = function(){
    return this.url;
};
/**
 * 添加客户端
 * @client      客户端
 * @md5         客户端的md5值
 */
Resource.prototype.addClient = function(client, md5){
    //如果md5值不匹配，则不添加，直接结束
    if(md5 != this.md5){
        return false;
    }
    //执行到此说明资源md5一致
    var i;
    var clients = this.clients;

    try{
        if(clients.length <= 0){
            clients.push(client);
            return true;
        }else{
            for(i = 0; i < clients.length; i++){
                if(clients[i].match(client)){
                    //客户端重复，不添加
                    return false;
                }else if(i == clients.length - 1){
                    //执行到这里说明该客户端没有出现过，添加客户端
                    clients.push(client);
                    return true;
                }
            }
        }
    }catch(e){
        //发生异常，不添加客户端
        return false;
    }
};
/**
 * 删除客户端
 * @client      客户度
 */
Resource.prototype.deleteClient = function(client){
    var i;
    var clients = this.clients;

    try{
        for(i = 0; i < clients.length; i++){
            if(clients[i].match(client)){
                //客户端重复删除客户端
                clients.splice(i, 1);
                break;
            }
        }
        //执行成功，返回删除成功
        return true;
    }catch(e){
        //出现错误，删除失败
        return false;
    }
};
/**
 * 获取所有客户端
 */
Resource.prototype.getAllClients = function(){
    return this.clients;
};
/**
 * 获取指定下表的客户端
 * @index
 */
Resource.prototype.getClient = function(index){
    if(index >= 0 && index < this.clients.length){
        return this.clients[index];
    }else{
        return null;
    }
};


/**
 * 构造函数（需要分离）
 * @url                 资源url
 */
module.exports = function(url){
    var resource = new Resource();

    return new Promise(function(resolve, reject){
        if(!url){
            reject(null);
        }else{
            //设置url
            resource.url = url;
            //获取md5
            utils.url.getMd5(url).then(function(md5){
                //获取成功，设置md5值
                resource.md5 = md5;
                resolve(resource);
            }).catch(function(e){
                //获取md5失败
                reject(e);
            });
        }
    });
}