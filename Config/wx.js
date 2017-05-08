/**
 * 我方配置
 */
//测试号配置
module.exports.appID = "wx2eacc8534f6de9de";
module.exports.appsecret = "b64ec098942b565403b141c0eaba2148";
module.exports.gid = "gh_185db494d3b9";

//公众号（测试）配置
//module.exports.appID = "wx7efdeea823d6046c";
//module.exports.appsecret = "918fb8ef4cbc2a0add5467bdd2371ab8";
//module.exports.gid = "gh_97bc297b83e1";

module.exports.noncestr = "Wm3WZYTPz0wzccnW";
/**
 * 获取的验证信息
 */
module.exports.accessToken = null;                      //微信access_token
module.exports.accessToken_expireIn = null;             //微信access_token过期时间
module.exports.ticket = null;                           //微信唯一票据
module.exports.ticket_expireIn = null;                  //微信唯一票据过期时间

/**
 * 微信配置
 */
module.exports.config = {
    accessTokenHost:"https://api.weixin.qq.com",
    accessTokenPath:"/cgi-bin/token",
    ticketHost:"https://api.weixin.qq.com",
    ticketPath:"/cgi-bin/ticket/getticket",
    jsApiList:[
        'onMenuShareTimeline',
        'onMenuShareAppMessage',
        'onMenuShareQQ',
        'onMenuShareWeibo',
        'onMenuShareQZone',
        'startRecord',
        'stopRecord',
        'onVoiceRecordEnd',
        'playVoice',
        'pauseVoice',
        'stopVoice',
        'onVoicePlayEnd',
        'uploadVoice',
        'downloadVoice',
        'chooseImage',
        'previewImage',
        'uploadImage',
        'downloadImage',
        'translateVoice',
        'getNetworkType',
        'openLocation',
        'getLocation',
        'hideOptionMenu',
        'showOptionMenu',
        'hideMenuItems',
        'showMenuItems',
        'hideAllNonBaseMenuItem',
        'showAllNonBaseMenuItem',
        'closeWindow',
        'scanQRCode',
        'chooseWXPay',
        'openProductSpecificView',
        'addCard',
        'chooseCard',
        'openCard',

        "openWXDeviceLib",//初始化设备库（只支持蓝牙设备）
        "closeWXDeviceLib",//关闭设备库（只支持蓝牙设备）
        "getWXDeviceInfos",//获取设备信息（获取当前用户已绑定的蓝牙设备列表）
        "sendDataToWXDevice",//发送数据给设备
        "startScanWXDevice",//扫描设备（获取周围所有的设备列表，无论绑定还是未被绑定的设备都会扫描到）
        "stopScanWXDevice",//停止扫描设备
        "connectWXDevice",//连接设备
        "disconnectWXDevice",//断开设备连接
        "getWXDeviceTicket",//获取操作凭证

        //下面是监听事件：
        "onWXDeviceBindStateChange",//微信客户端设备绑定状态被改变时触发此事件
        "onWXDeviceStateChange",//监听连接状态，可以监听连接中、连接上、连接断开
        "onReceiveDataFromWXDevice",//接收到来自设备的数据时触发
        "onScanWXDeviceResult",//扫描到某个设备时触发
        "onWXDeviceBluetoothStateChange"//手机蓝牙打开或关闭时触发
    ]
/*
    jsApiList:[
        "openWXDeviceLib",//初始化设备库（只支持蓝牙设备）
        "closeWXDeviceLib",//关闭设备库（只支持蓝牙设备）
        "getWXDeviceInfos",//获取设备信息（获取当前用户已绑定的蓝牙设备列表）
        "sendDataToWXDevice",//发送数据给设备
        "startScanWXDevice",//扫描设备（获取周围所有的设备列表，无论绑定还是未被绑定的设备都会扫描到）
        "stopScanWXDevice",//停止扫描设备
        "connectWXDevice",//连接设备
        "disconnectWXDevice",//断开设备连接
        "getWXDeviceTicket",//获取操作凭证

        //下面是监听事件：
        "onWXDeviceBindStateChange",//微信客户端设备绑定状态被改变时触发此事件
        "onWXDeviceStateChange",//监听连接状态，可以监听连接中、连接上、连接断开
        "onReceiveDataFromWXDevice",//接收到来自设备的数据时触发
        "onScanWXDeviceResult",//扫描到某个设备时触发
        "onWXDeviceBluetoothStateChange"//手机蓝牙打开或关闭时触发
    ]*/
};