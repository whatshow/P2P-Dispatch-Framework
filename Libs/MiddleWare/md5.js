/*** 模块引用 ***/
var path = require("path");
var fs = require("fs");
var crypto = require('crypto');

module.exports =  function(req, res, next){
    var url = req.url;
    if(!url || url.length <= 0){
        next();
    }else{
        //url存在，尝试寻找（可能会出现资源文件打不开的情况）
        fs.stat(path.join(__dirname, '../../Resource' + url), function(err, stats) {
            if (err) {
                //发生错误，直接跳过
                next();
            }else if(!stats.isFile()){
                //不是文件，直接跳过
                next();
            }else{
                var stream = fs.createReadStream(path.join(__dirname, '../../Resource' + url));
                var hash = crypto.createHash('md5');
                stream.on('data', hash.update.bind(hash));
                stream.on('end', function () {
                    res.header("md5", hash.digest('hex'));
                    next();
                });
            }
        });
    }
};