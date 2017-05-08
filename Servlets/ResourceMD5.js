/*** 模块引用 ***/
var path = require("path");
var fs = require("fs");
var crypto = require('crypto');
var express = require('express');
var router = express.Router();
/*** 自定义模块 ***/
var utils = require("../Libs/Utils");
var rh = require("../Libs/ResponseHandler");

//路由
router.all("/", function(req, res, next){
    var url = (req.body && req.body.url) || (req.query && req.query.url);
    if(!url || url.length <= 0){
        rh(res, 404, null, '该资源不存在', null, null);
    }else{
        //转成相对路径
        url = utils.url.toRelativeURL(url);

        //资源存在，尝试寻找
        fs.stat(path.join(__dirname, '../Resource' + url), function(err, stats){
            if(err){
                rh(res, 404, null, '该资源不存在', null, null);
            }else{
                //文件存在，尝试计算md5
                var stream = fs.createReadStream(path.join(__dirname, '../Resource' + url));
                var hash = crypto.createHash('md5');
                stream.on('data', hash.update.bind(hash));
                stream.on('end', function () {
                    rh(res, 200, null, '成功', null, {md5: hash.digest('hex')});
                });
            }
        });
    }
});

module.exports = router;