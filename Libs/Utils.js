/*** 模块引用 ***/
var path = require("path");
var fs = require("fs");
var crypto = require('crypto');
var Promise = require('es6-promise').Promise;
/*** 自定义模块 ***/
var httpclient = require("./Http/client");
var config = require("../Config/server");


//工具集合
var utils = {};
/*** 数组工具 ***/
utils.array = {};
/***
 * 循环
 * @objs                数组对象
 * @callback            回调函数 function(index, objs[index], resolve)
 * @index               下标，默认0
 */
utils.array.loop = function(objs, callback, index){
    if(!objs || objs.length <= 0){
        //不是数组对象
        return new Promise(function(resolve, reject){
            resolve();
        });
    }else{
        //规范下标参数
        if(!index){
            index = 0;
        }
        if(index >= objs.length){
            //越界，直接结束
            return new Promise(function(resolve, reject){
                resolve();
            });
        }else{
            //没有越界，继续循环
            return new Promise(function(resolve, reject){
                if(callback && typeof callback == "function"){
                    //传递参数，可以决定何时执行下一步
                    callback(index, objs[index], resolve);
                }else{
                    //没有回掉，直接下一步
                    resolve();
                }
            }).then(function(){
                //遍历下一次循环
                return utils.array.loop(objs, callback, index + 1);
            });
        }
    }
};

/*** url工具 ***/
utils.url = {};
/**
 * 是否有重复项
 * @urls                url数组
 */
utils.url.hasSameOne = function(urls){
    var i, j;
    if(!urls){
        return false;
    }else{
        for(i = 0; i < urls.length; i++){
            for(j = i + 1; j < urls.length; j++){
                if(urls[i] == urls[j]){
                    //检测到重复项
                    return true;
                }
            }
        }
        //没有重复项
        return false;
    }
};
/**
 * 去除重复url
 * @urls                 url数组
 */
utils.url.removeSame = function(urls){
    if(!urls) {
        return null;
    }

    var i, j;
    var hasSameOne = true;
    while(hasSameOne){
        //尝试去除重复项
        for(i = 0; i < urls.length; i++){
            for(j = i + 1; j < urls.length; j++){
                if(urls[i] == urls[j]){
                    urls.splice(j ,1);
                }
            }
        }
        //检查是否还有重复的
        hasSameOne = window.ppdf.Utils.url.hasSameOne(urls);
    }
};
/**
 * 获取服务器路径（如果返回，则字符串结尾必定含有/）
 * @url                     绝对路径
 */
utils.url.getServer = function(url){
    if(!url) {
        return null;
    }else if(url.indexOf("http://") == 0){
        //http协议
        return url.match(/^http:\/\/[a-zA-Z0-9\.:]*\//)[0];
    }else if(url.indexOf("https://") == 0){
        //https协议
        return url.match(/^https:\/\/[a-zA-Z0-9\.:]*\//)[0];
    }else if(url.indexOf("//") == 0){
        //通用协议
        return url.match(/^\/\/[a-zA-Z0-9\.:]*\//)[0];
    }else{
        //不是绝对路径
        return null;
    }
};
/**
 * 转成相对路径
 * @url             资源路径
 */
utils.url.toRelativeURL = function(url){
    //获取到server才是相对路径
    var server = utils.url.getServer(url);
    if(server){
        url = url.substring(server.length, url.length);
    }
    //规范一下url
    if(url[0] != "/"){
        url = "/" + url;
    }
    return url;
};
/**
 * 是否是绝对路径
 * @url             资源路径
 */
utils.url.isAbsolute = function(url){
    if(!url) {
        return false;
    }else if(url.indexOf("http://") == 0){
        //http协议
        return true;
    }else if(url.indexOf("https://") == 0){
        //https协议
        return true;
    }else if(url.indexOf("//") == 0){
        //通用协议
        return true;
    }else{
        //不是绝对路径
        return false;
    }
};
/**
 * 拼装一个servlet的绝对路径
 * @server
 * @servletRelativePath
 */
utils.url.getServletAbsolutePath = function(server, servletRelativePath){
    if(server[server.length - 1] != '/'){
        server = server + "/";
    }
    if(servletRelativePath[0] == '/'){
        servletRelativePath = servletRelativePath.substring(1, servletRelativePath.length);
    }
    return server + servletRelativePath;
};
/**
 * 获取资源的md5
 * @url
 */
utils.url.getMd5 = function(url, callback){
    switch(typeof callback){
        //执行回调
        case "function":
            if(!utils.url.isAbsolute(url)){
                //资源不是绝对路径，无法寻找
                callback();
            }else{
                var server = utils.url.getServer(url);
                if(!server || server == ""){
                    //获取不到资源服务器
                    callback();
                }else{
                    var servlet = utils.url.getServletAbsolutePath(server, config.resource.servlets.md5);
                    //通过http获取资源的md5
                    httpclient.get(servlet + "?url=" + url).then(function(txt){
                        try{
                            var res = JSON.parse(txt);
                            if(res.data && res.data.md5){
                                callback(res.data.md5);
                            }else{
                                callback();
                            }
                        }catch(e){
                            //json化失败，服务器故障
                            callback(e);
                        }
                    }).catch(function(e){
                        //获取失败
                        callback(e);
                    });
                }
            }
            break;
        //返回回调参数
        default:
            return new Promise(function(resolve, reject){
                if(!utils.url.isAbsolute(url)){
                    //资源不是绝对路径，无法寻找
                    reject();
                }else{
                    //寻找获取这个资源的获取md5的配置
                    var server = utils.url.getServer(url);
                    if(!server || server == ""){
                        //获取不到资源服务器
                        reject();
                    }else{
                        var servlet = utils.url.getServletAbsolutePath(server, config.resource.servlets.md5);
                        //通过http获取资源的md5
                        httpclient.get(servlet + "?url=" + url).then(function(txt){
                            try{
                                var res = JSON.parse(txt);
                                if(res.data && res.data.md5){
                                    resolve(res.data.md5);
                                }else{
                                    //返回值故障
                                    reject();
                                }
                            }catch(e){
                                //json化失败，服务器故障
                                reject(e);
                            }
                        }).catch(function(){
                            //获取失败
                            reject();
                        });
                    }
                }
            });
            break;
    }
};


module.exports = utils;