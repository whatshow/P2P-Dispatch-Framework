//json web token
var jwt = require("jwt-simple");
var jwtConfig = require("./jwtConfig");
//path
var path = require('path');
//fs
var fs = require("fs");
//返回json格式数据
var rh = require("/ResponseHandler");

module.exports.verify = function(req, res, next){

};

/**
 * 第三方用户——权限检查
 */
module.exports.thirdpart_verify = function(req, res, next){
    var accessId = (req.body && req.body.accessId) || (req.query && req.query.accessId);
    var accessSecret = (req.body && req.body.accessSecret) || (req.query && req.query.accessSecret);
    if(!accessId || !accessSecret){
        //没有用户名或密码
        rh(res, 4000, null, "无权访问(4000)", null, null);
    }else{
        //有用户名或密码
        //读取第三方用户名密码文件
        fs.readFile(path.join(__dirname, '../Config/ThirdPartConfig'),{encoding:'utf-8'}, function (err,bytesRead) {
            if (err){
                //读取配置文件失败
                rh(res, 4001, null, "禁止任何用户登录", null, null);
            }else{
                //读取配置文件成功
                var isExist = false;
                var accounts = JSON.parse(bytesRead);
                for(var i = 0; i < accounts.length; i++){
                    if(accessId == accounts[i].accessId && accessSecret == accounts[i].accessSecret){
                        isExist = true;
                        break;
                    }
                }
                if(!isExist){
                    rh(res, 4002, null, "无权访问(4002)", null, null);
                }else{
                    //成功
                    next();
                }
            }
        });
    }
};