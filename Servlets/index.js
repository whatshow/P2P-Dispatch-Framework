//
//var express = require('express');
//var router = express.Router();
//var rh = require("../Libs/ResponseHandler");
//var ossConfig = require("../Config/Ali/OSSConfig");
//
//
///* GET home page. */
//router.all('/', function(req, res, next) {
//    var co = require('co');
//    var OSS = require('ali-oss');
//    var client = new OSS({
//        region: ossConfig.hangzhou.region,
//        accessKeyId: ossConfig.accounts.server_catalog.accessKeyId,
//        accessKeySecret: ossConfig.accounts.server_catalog.accessKeySecret,
//        bucket: ossConfig.hangzhou.bucket[1]
//    });
//
//
//    var name = (req.body && req.body.name) || (req.query && req.query.name);
//    var sdata = (req.body && req.body.data) || (req.query && req.query.data);
//    if(!name || !sdata){
//        rh(res, 400, null, "缺少参数", null, null);
//    }else{
//        //构造出buffer
//        var buffer = new Buffer(sdata, "base64");
//        //写入object
//        co(function* () {
//            var result = yield client.put(name, buffer);
//            rh(res, 200, null, "上传成功", null, null);
//        }).catch(function (err) {
//            console.log(err);
//            rh(res, 401, null, "上传失败" + err.toString(), null, null);
//        });
//    }
//});
//module.exports = router;