/*** 模块引用 ***/
var http = require("http");


var client = {
    /**
     * 获取资源
     * @url
     */
    get:    function(url){
        return new Promise(function(resolve, reject){
            if(!url){
                reject();
            }else{
                http.get(url, function(res){
                    //获取到数据，则返回
                    res.on("data", function(res){
                        resolve(res);
                    });
                }).on('error', function(e){
                    reject(e);
                });
            }
        });
    }
};
module.exports = client;