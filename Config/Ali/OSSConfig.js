/* 阿里账号配置 */
module.exports.accounts = {
    //可以扮演角色的账号
    app_sts:{
        accessKeyId:"ruclDiaRPg00Vy7z",
        accessKeySecret:"R0ibkbvVN6djX4LapjouXTTEAazIeo"
    },
    //提供目录检索服务的账号
    server_catalog:{
        accessKeyId:"oXig8oMx5gdSmqGW",
        accessKeySecret:"scgdqhIKw96k2bVf8FucyXgt2VJTA0"
    },
    //提供论坛操作权限的账号
    server_forum_fullaccess:{
        accessKeyID:"LTAIa5Cpd9sBGXzs",
        accessKeySecret:"xo7cLnHMc1XJCfibtWUmlzjNO51mli"
    },
    //提供在OSS的xp-data-heart中创建目录的账号
    server_oss_xpdataheart_createfolder:{
        accessKeyId:"4i2neYtGmbpyLf4y",
        accessKeySecret:"gIfu1XjLEbV1Us7j1aaQ67SNoLGx1S"
    }
};

/**
 * 杭州oss节点
 */
module.exports.hangzhou = {
    bucket: ['test-xp-userinfo', 'xp-data-heart', "xp-forum"],
    endpoint_outter: 'http://oss-cn-hangzhou.aliyuncs.com',                     //oss路径
    endpoint_inner: "http://oss-cn-hangzhou-internal.aliyuncs.com",             //内网访问路径
    region: 'oss-cn-hangzhou'                                                   //oss区域
};