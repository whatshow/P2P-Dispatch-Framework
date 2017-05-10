(function(){
    window.ppdf = {};
})();
(function(){
    if(window.ppdf){
        ppdf.config = {
          resource:{
              servlet:{
                  md5:      "md5"
              }
          },
          signal:{
              //server:   "ws://192.168.1.6:10000"
              server:   "ws://192.168.50.158:10000"
              //server:   "ws://192.168.1.6:3000"
          },
          p2p:{
              iceServers:[
                  {
                      "url":"stun:stun.l.google.com:19302"
                  },
                  {
                      "url":"turn:numb.viagenie.ca",
                      username:"webrtc@live.com",
                      credential:"muazkh"
                  }
              ]
          },
          database:{
              warning:   "数据库配置见Database.js"
          }
        };
    }
})();
(function(){
    var wTag = "警告(AJAX)：";        //警告标签


    //如果存在这个框架，则尝试增加ajax功能
    if(window.ppdf){
        window.ppdf.ajax = {
            xmlhttp:        null,
            default:{
                timeout:    10000               //默认10秒连接断开
            },

            /**
             * 初始化ajax请求
             */
            init:   function(){
                return new Promise(function(resolve, reject){
                    if(window.ActiveXObject){
                        var ieAjaxTypes = ["MSXML2.XMLHttp.6.0","MSXML2.XMLHttp.5.0", "MSXML2.XMLHttp.4.0","MSXML2.XMLHttp.3.0","MSXML2.XMLHttp","Microsoft.XMLHttp"];
                        for(var ieAjaxTypes_index = 0; ieAjaxTypes_index < ieAjaxTypes.length; ieAjaxTypes_index++) {
                            try{
                                window.ppdf.ajax.xmlhttp = new ActiveXObject(ieAjaxTypes[ieAjaxTypes_index]);
                                resolve();
                                break;
                            }catch(e){}
                        }
                    }else{
                        try {
                            window.ppdf.ajax.xmlhttp = new XMLHttpRequest();
                            resolve();
                        }catch(e){
                            //执行到此说明无论如何都无法开启ajax
                            reject(new window.ppdf.Utils.Error(40041, "无法开启ajax", null));
                        }
                    }
                });
            },
            /**
             * 获取消息
             * @url                                           资源
             * @type                                          数据类型（text或json）
             */
            get: function(url, type){
                return new Promise(function(resolve, reject){
                    if(!window.ppdf.ajax.xmlhttp){
                        reject(new window.ppdf.Utils.Error(40042, "未初始化ajax", null));
                    }else{
                        //规范化url
                        if(!url){
                            url = "";
                        }
                        //规范化返回类型
                        if(!type){
                            type = "text";
                        }else{
                            type = type.toLowerCase();
                            switch(type){
                                case "text":
                                case "json":
                                    break;
                                default:
                                    type = "text";
                            }
                        }
                        //尝试ajax
                        try{
                            //打开连接
                            window.ppdf.ajax.xmlhttp.open("GET", url, true);
                            //配置参数
                            window.ppdf.ajax.xmlhttp.overrideMimeType(type);
                            window.ppdf.ajax.xmlhttp.responseType = type;
                            window.ppdf.ajax.xmlhttp.timeout = window.ppdf.ajax.default.timeout;
                            //设置回调函数
                            window.ppdf.ajax.xmlhttp.onreadystatechange = function(){
                                if(window.ppdf.ajax.xmlhttp.readyState == 4){
                                    if(window.ppdf.ajax.xmlhttp.status == 200){
                                        resolve(window.ppdf.ajax.xmlhttp.response);
                                    }else{
                                        reject(new window.ppdf.Utils.Error(40043, "返回异常", {code: window.ppdf.ajax.xmlhttp.status, XmlHttpRequest: window.ppdf.ajax.xmlhttp}));
                                    }
                                }
                            };
                            //设置超时回调
                            window.ppdf.ajax.xmlhttp.ontimeout = function(error){
                                reject(new window.ppdf.Utils.Error(40044, "响应超时", error));
                            };
                            //设置错误回调
                            window.ppdf.ajax.xmlhttp.onerror = function(error){
                                reject(new window.ppdf.Utils.Error(40045, "通讯故障", error));
                            };
                            //发送连接
                            window.ppdf.ajax.xmlhttp.send();
                        }catch(e){
                            reject(new window.ppdf.Utils.Error(40046, "未知故障", e));
                        }
                    }
                });
            },
            /**
             * 获取二进制数据
             * @参数1             存在config & url 两种情况：config是注入配置操作；url是promise
             * @参数2             当参数1是url时，参数2是http方法
             */
            acquireBlob:    function(){
                var url;
                var method;
                var config;
                var ajax;

                //尝试构造ajax对象
                if(window.ActiveXObject){
                    var ieAjaxTypes = ["MSXML2.XMLHttp.6.0","MSXML2.XMLHttp.5.0", "MSXML2.XMLHttp.4.0","MSXML2.XMLHttp.3.0","MSXML2.XMLHttp","Microsoft.XMLHttp"];
                    for(var ieAjaxTypes_index = 0; ieAjaxTypes_index < ieAjaxTypes.length; ieAjaxTypes_index++) {
                        try{
                            ajax = new ActiveXObject(ieAjaxTypes[ieAjaxTypes_index]);
                            break;
                        }catch(e){}
                    }
                }else{
                    try {
                        ajax = new XMLHttpRequest();
                    }catch(e){}
                }

                //根据参数1的类型操作
                var param_1 = arguments[0];
                switch(typeof param_1){
                    case "object":
                        //传入配置参数，按照配置执行
                        config = param_1;
                        if(ajax && config.url){
                            url = config.url;
                            method = window.ppdf.Utils.ajax.normalizeMethod(config.method);
                            //连接
                            try{
                                //打开连接
                                ajax.open(method, url, true);
                                //配置参数
                                ajax.responseType = "blob";
                                window.ppdf.ajax.xmlhttp.timeout = window.ppdf.ajax.default.timeout;
                                //设置回调函数
                                ajax.onreadystatechange = function(){
                                    if(ajax.readyState == 4){
                                        if(ajax.status == 200){
                                            if(typeof config.success == "function"){
                                                if(config.callbackParam == "ajax"){
                                                    config.success(ajax);
                                                }else{
                                                    config.success(ajax.response);
                                                }
                                            }
                                        }else{
                                            if(typeof config.error == "function"){
                                                config.error(new window.ppdf.Utils.Error(40043, "返回异常", {code: window.ppdf.ajax.xmlhttp.status, res: window.ppdf.ajax.xmlhttp.response}));
                                            }
                                        }
                                    }
                                };
                                //设置超时回调
                                ajax.ontimeout = function(error){
                                    if(typeof config.error == "function"){
                                        config.error(new window.ppdf.Utils.Error(40044, "响应超时", error));
                                    }
                                };
                                //设置错误回调
                                ajax.onerror = function(error){
                                    if(typeof config.error == "function"){
                                        config.error(new window.ppdf.Utils.Error(40045, "通讯故障", error));
                                    }
                                };
                                //发送连接
                                ajax.send();
                            }catch(e){
                                if(typeof config.error == "function"){
                                    config.error(new window.ppdf.Utils.Error(40046, "未知故障", e));
                                }
                            }
                        }
                        break;
                    case "string":
                        //依次获取其它参数
                        url = param_1;
                        method = window.ppdf.Utils.ajax.normalizeMethod(arguments[1]);
                        //返回promise对象
                        return new Promise(function(resolve, reject){
                            if(!ajax){
                                reject(new window.ppdf.Utils.Error(40041, "无法开启ajax", null));
                            }else if(url){
                                try{
                                    //打开连接
                                    ajax.open(method, url, true);
                                    //配置参数
                                    ajax.responseType = "blob";
                                    window.ppdf.ajax.xmlhttp.timeout = window.ppdf.ajax.default.timeout;
                                    //设置回调函数
                                    ajax.onreadystatechange = function(){
                                        if(ajax.readyState == 4){
                                            if(ajax.status == 200){
                                                resolve(ajax);
                                            }else{
                                                reject(new window.ppdf.Utils.Error(40043, "返回异常", {code: window.ppdf.ajax.xmlhttp.status, res: window.ppdf.ajax.xmlhttp.response}));
                                            }
                                        }
                                    };
                                    //设置超时回调
                                    ajax.ontimeout = function(error){
                                        reject(new window.ppdf.Utils.Error(40044, "响应超时", error));
                                    };
                                    //设置错误回调
                                    ajax.onerror = function(error){
                                        reject(new window.ppdf.Utils.Error(40045, "通讯故障", error));
                                    };
                                    //发送连接
                                    ajax.send();
                                }catch(e){
                                    reject(new window.ppdf.Utils.Error(40046, "未知故障", e));
                                }
                            }
                        });
                        break;
                    case "undefined":
                    default:
                        //参数异常，不做任何操作
                        break;
                }

            }
        };

        /**
         * 发送ajax请求
         * @param                                           json类型参数
         * {
         *  @method                                         方法：get、post
         *  @url                                            地址
         *  @async                                          是否是异步的：true、false
         *  @headers                                        形如[{key:, value:}, ..]格式的http头
         *  @timeout                                        超时时间（单位：毫秒）
         *  @data                                           参数（类型：json,string）
         *
         *  @requestType                                    请求内容类型：json,text
         *
         *  @reponseType                                    返回类型：json,text,blob
         *
         *  @success                                        成功回调
         *  @error(xmlhttprequest, msg, e)                  错误回调（情况：超时）
         * }
         */
        //window.ppdf.ajax = function(param){
        //    //处理参数
        //    if(!param.url){
        //        param.url = "";                                             //默认请求地址为空串
        //    }
        //    if(!param.method){
        //        param.method = "GET";                                       //默认get方法
        //    }else{
        //        param.method = param.method.toUpperCase();                  //转成大写
        //    }
        //    if(!param.async){
        //        param.async = true;                                         //默认异步操作
        //    }
        //    if(!param.headers){
        //        param.headers = [];                                         //默认空header
        //    }
        //
        //    if(!param.requestType){
        //        param.requestType = "text";                                 //默认字符串格式
        //    }else{
        //        param.requestType = param.requestType.toLowerCase();        //转成小写
        //    }
        //
        //    //构造xmlhttp对象
        //    var xmlhttp = null;
        //    if(window.ActiveXObject){
        //        var ieAjaxTypes = ["MSXML2.XMLHttp.6.0","MSXML2.XMLHttp.5.0", "MSXML2.XMLHttp.4.0","MSXML2.XMLHttp.3.0","MSXML2.XMLHttp","Microsoft.XMLHttp"];
        //        for(var ieAjaxTypes_index = 0; ieAjaxTypes_index < ieAjaxTypes.length; ieAjaxTypes_index++) {
        //            try{
        //                xmlhttp = new ActiveXObject(ieAjaxTypes[ieAjaxTypes_index]);
        //                break;
        //            }catch(e){}
        //        }
        //    }else{
        //        try {
        //            xmlhttp =new XMLHttpRequest();
        //        }catch(e){}
        //    }
        //
        //    //发送ajax请求
        //    if(!xmlhttp){
        //        console.log(wTag + "浏览器不支持ajax");
        //    }else{
        //        //打开
        //        xmlhttp.open(param.method, param.url, param.async);
        //
        //        //发送前准备
        //        //设置http头
        //        for(var headers_index = 0; headers_index < param.headers.length; headers_index++){
        //            xmlhttp.setRequestHeader(param.headers[headers_index].key, param.headers[headers_index].value);
        //        }
        //        //设置请求类型
        //        if(param.requestType){
        //            xmlhttp.overrideMimeType(param.requestType);
        //        }
        //        //设置接收类型
        //        if(param.responseType){
        //            xmlhttp.responseType = param.responseType;
        //        }
        //
        //
        //        //设置回调函数
        //        xmlhttp.onreadystatechange = function(){
        //            if(xmlhttp.readyState == 4){
        //                switch(xmlhttp.status){
        //                    case 200:
        //                        try{
        //                            param.success(xmlhttp.response);
        //                        }catch(e){}
        //                        break;
        //                    case 302:
        //                        break;
        //                    case 304:
        //                        break;
        //                }
        //            }
        //        };
        //
        //        //发送请求
        //        switch(typeof param.data){
        //            case "string":
        //                //字符串类型不处理
        //                break;
        //            case "object":
        //                //对象类型，尝试转换成参数
        //                try{
        //                    param.data = JSON.stringify(param.data).replace(/{/g, "").replace(/}/g, "").replace(/,/g, "&");
        //                }catch(e){
        //                    param.data = "";
        //                }
        //                break;
        //            default:
        //                param.data = "";
        //                break;
        //        }
        //        xmlhttp.send(param.data);
        //    }
        //};
    }
})();
(function(){
    if(window.ppdf){
        window.ppdf.ConfigRefreshAndClose = {
            /**
             * 开启配置
             * @str                         显示的字符串
             */
            startConfig: function(str){
                str = str || "您确定要退出吗？";
                window.onbeforeunload = function(e){
                    var event = e || window.event;
                    if (event) {  //for ie and firefox
                        event.returnValue = str;
                    }
                    return str; //for safari and chrome
                };
            },
            /**
             * 终止配置
             */
            endConfig:function(){
                window.onbeforeunload = null;
            }
        };
    }
})();
(function(){
    var wTag = "警告(Database)：";                                                         //警告标签
    //尝试增加Database功能
    if(!window.ppdf || (!window.indexedDB && !window.mozIndexedDB && !window.webkitIndexedDB)){
        window.ppdf.database = null;
    }else{
        window.ppdf.database = {
            //数据库对象
            dbs:{
                //信息数据库
                data:{
                    name:               "ppdf-data",
                    obj:                null,
                    tables:{
                        data:{
                            name:       "data"
                        }
                    }
                }
            },
            /**
             * 初始化数据库
             * @resolve(database)                           获取数据库对象
             * @reject(error)                               获取报错信息
             */
            initDB: function(){
                return new Promise(function(resolve, reject){
                    var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB;
                    var reqDB;
                    reqDB = indexedDB.open(window.ppdf.database.dbs.data.name, 1);
                    reqDB.onerror = function(e){
                        //说明本地数据库已经存在，尝试重新打开
                        reqDB = null;
                        reqDB = indexedDB.open(window.ppdf.database.dbs.data.name, 2);
                        reqDB.onsuccess = function(e){
                            window.ppdf.database.dbs.data.obj = reqDB.result;
                            resolve();
                        };
                        reqDB.onerror = function(e){
                            //数据库依旧打不开，错误未知
                            reject(new ppdf.Utils.Error(40031,  "数据库无法创建（原因未知）", e));
                        }
                    };
                    reqDB.onsuccess = function(e){
                        //关闭数据库，重新打开升级数据库，尝试添加表
                        reqDB.result.close();
                        reqDB = null;
                        reqDB = indexedDB.open(window.ppdf.database.dbs.data.name, 2);
                        reqDB.onupgradeneeded = function(e){
                            reqDB.result.createObjectStore(window.ppdf.database.dbs.data.tables.data.name, {keyPath:"url"});
                        };
                        reqDB.onsuccess = function(e){
                            window.ppdf.database.dbs.data.obj = reqDB.result;
                            resolve();
                        };
                        reqDB.onerror = function(e){
                            //升级数据库失败
                            reject(new ppdf.Utils.Error(40032, "升级数据库失败", e));
                        };
                    };
                });
            },
            /**
             * 获取所有数据
             * @type                            类型：all：含有blob类型的数据, catalog：不含有blob类型的数据，默认是catalog
             */
            getAllData:    function(type){
                return new Promise(function(resolve, reject){
                    var reqCursor;
                    var transaction_getAllData;
                    var objectStore;
                    var cursor;
                    var data = [];

                    if(!window.ppdf.database.dbs.data.obj){
                        reject(new ppdf.Utils.Error(40031, "数据库未创建", null));
                    }else{
                        //尝试打开游标
                        transaction_getAllData =  window.ppdf.database.dbs.data.obj.transaction([window.ppdf.database.dbs.data.tables.data.name], "readonly");
                        objectStore = transaction_getAllData.objectStore(window.ppdf.database.dbs.data.tables.data.name);
                        reqCursor = objectStore.openCursor();
                        reqCursor.onerror = function(e){
                            //打开游标失败，返回null
                            resolve(null);
                        };
                        reqCursor.onsuccess = function(e){
                            cursor = e.target.result;
                            if(cursor){
                                //有数据，读取
                                if(!type || type == "catalog"){
                                    //仅仅获取目录，去除blob类型
                                    if(cursor.value.data){
                                        cursor.value.data = null;
                                    }
                                }
                                data.push(cursor.value);
                                cursor.continue();
                            }else{
                                //没有数据，返回结果
                                resolve(data);
                            }
                        }
                    }
                });
            },
            /**
             * 添加数据
             * @data                    数据
             */
            addData:    function(data){
                return new Promise(function(resolve, reject){
                    var transaction;
                    var objectStore;
                    var reqAdd;

                    if(! window.ppdf.database.dbs.data.obj){
                        reject(new ppdf.Utils.Error(40031, "数据库未创建", null));
                    }else if(!data){
                        reject(new ppdf.Utils.Error(40033, "数据不存在", null));
                    }else{
                        transaction =  window.ppdf.database.dbs.data.obj.transaction([window.ppdf.database.dbs.data.tables.data.name], "readwrite");
                        objectStore = transaction.objectStore(window.ppdf.database.dbs.data.tables.data.name);
                        reqAdd = objectStore.put(data);
                        reqAdd.onerror = function(e){
                            reject(new ppdf.Utils.Error(40034, "数据添加失败", e));
                        };
                        reqAdd.onsuccess = function(){
                            //数据添加成功
                            resolve(data);
                        };
                    }
                });
            },
            /**
             * 删除一条数据
             * @url                 数据连接
             */
            deleteData: function(url){
                var transaction;
                var objectStore;
                var reqDelete;

                return Promise(function(resolve, reject){
                    if(! window.ppdf.database.dbs.data.obj) {
                        reject(new ppdf.Utils.Error(40031, "数据库未创建", null));
                    }else if(!url){
                        reject(new ppdf.Utils.Error(40033, "数据地址没有传入", null));
                    }else{
                        transaction = window.ppdf.database.dbs.data.obj.transaction([window.ppdf.database.dbs.data.tables.data.name], "readwrite");
                        objectStore = transaction.objectStore(window.ppdf.database.dbs.data.tables.data.name);
                        reqDelete = objectStore.delete(url);
                        reqDelete.onerror = function(error){
                            reject(new ppdf.Utils.Error(40035, "删除数据失败", error));
                        };
                        reqDelete.onsuccess = function(event){
                            resolve();
                        };
                    }
                });
            },
            /**
             * 获取一条数据
             * @url
             */
            getData:    function(url){
                var transaction;
                var objectStore;
                var reqGet;

                return new Promise(function(resolve, reject){
                    if(! window.ppdf.database.dbs.data.obj) {
                        reject(new ppdf.Utils.Error(40031, "数据库未创建", null));
                    }else if(!url) {
                        reject(new ppdf.Utils.Error(40033, "连接没有传入", null));
                    }else{
                        transaction = window.ppdf.database.dbs.data.obj.transaction([window.ppdf.database.dbs.data.tables.data.name], "readonly");
                        objectStore = transaction.objectStore(window.ppdf.database.dbs.data.tables.data.name);
                        reqGet = objectStore.get(url);
                        reqGet.onerror = function(e){
                            reject(new ppdf.Utils.Error(40036, "数据不存在", e));
                        };
                        reqGet.onsuccess = function(e){
                            var data = e.target.result;
                            resolve(data);
                        };
                    }
                });
            }
        };
    }
})();
(function(){
    if(!window.ppdf){
        return;
    }


    var DomReady = window.ppdf.DomReady = {};



    // Everything that has to do with properly supporting our document ready event. Brought over from the most awesome jQuery.



    var userAgent = navigator.userAgent.toLowerCase();



    // Figure out what browser is being used

    var browser = {

        version: (userAgent.match( /.+(?:rv|it|ra|ie)[//: ]([/d.]+)/ ) || [])[1],

        safari: /webkit/.test(userAgent),

        opera: /opera/.test(userAgent),

        msie: (/msie/.test(userAgent)) && (!/opera/.test( userAgent )),

        mozilla: (/mozilla/.test(userAgent)) && (!/(compatible|webkit)/.test(userAgent))

    };



    var readyBound = false;

    var isReady = false;

    var readyList = [];



    // Handle when the DOM is ready

    function domReady() {

        // Make sure that the DOM is not already loaded

        if(!isReady) {

            // Remember that the DOM is ready

            isReady = true;



            if(readyList) {

                for(var fn = 0; fn < readyList.length; fn++) {

                    readyList[fn].call(window, []);

                }



                readyList = [];

            }

        }

    };



    // From Simon Willison. A safe way to fire onload w/o screwing up everyone else.

    function addLoadEvent(func) {

        var oldonload = window.onload;

        if (typeof window.onload != 'function') {

            window.onload = func;

        } else {

            window.onload = function() {

                if (oldonload) {

                    oldonload();

                }

                func();

            }

        }

    };



    // does the heavy work of working through the browsers idiosyncracies (let's call them that) to hook onload.

    function bindReady() {

        if(readyBound) {

            return;

        }



        readyBound = true;



        // Mozilla, Opera (see further below for it) and webkit nightlies currently support this event

        if (document.addEventListener && !browser.opera) {

            // Use the handy event callback

            document.addEventListener("DOMContentLoaded", domReady, false);

        }



        // If IE is used and is not in a frame

        // Continually check to see if the document is ready

        if (browser.msie && window == top) (function(){

            if (isReady) return;

            try {

                // If IE is used, use the trick by Diego Perini

                // http://javascript.nwbox.com/IEContentLoaded/

                document.documentElement.doScroll("left");

            } catch(error) {

                setTimeout(arguments.callee, 0);

                return;

            }

            // and execute any waiting functions

            domReady();

        })();



        if(browser.opera) {

            document.addEventListener( "DOMContentLoaded", function () {

                if (isReady) return;

                for (var i = 0; i < document.styleSheets.length; i++)

                    if (document.styleSheets[i].disabled) {

                        setTimeout( arguments.callee, 0 );

                        return;

                    }

                // and execute any waiting functions

                domReady();

            }, false);

        }



        if(browser.safari) {

            var numStyles;

            (function(){

                if (isReady) return;

                if (document.readyState != "loaded" && document.readyState != "complete") {

                    setTimeout( arguments.callee, 0 );

                    return;

                }

                if (numStyles === undefined) {

                    var links = document.getElementsByTagName("link");

                    for (var i=0; i < links.length; i++) {

                        if(links[i].getAttribute('rel') == 'stylesheet') {

                            numStyles++;

                        }

                    }

                    var styles = document.getElementsByTagName("style");

                    numStyles += styles.length;

                }

                if (document.styleSheets.length != numStyles) {

                    setTimeout( arguments.callee, 0 );

                    return;

                }



                // and execute any waiting functions

                domReady();

            })();

        }



        // A fallback to window.onload, that will always work

        addLoadEvent(domReady);

    };



    // This is the public function that people can use to hook up ready.

    DomReady.ready = function(fn, args) {

        // Attach the listeners

        bindReady();



        // If the DOM is already ready

        if (isReady) {

            // Execute the function immediately

            fn.call(window, []);

        } else {

            // Add the function to the wait list

            readyList.push( function() { return fn.call(window, []); } );

        }

    };



    bindReady();



})();
//资源
window.ppdf.Resource = function(obj, url, attr, childNodes){
    if(!obj){
        return null;
    }
    if(!url){
        url = "";
    }
    if(!attr){
        attr = "src";
    }
    if(!childNodes){
        childNodes = [];
    }
    //保存属性
    this.obj = obj;                             //对象
    this.url = url;                             //链接
    this.attr = attr;                           //属性
    this.childNodes = childNodes;               //子节点
};
/***
 * 重新加载（只有audio、video元素需要重新加载）
 * @blob                                        二进制数据
 */
window.ppdf.Resource.load = function(blob){
    if(blob){

    }

    //重新加载
    try{
        this.obj.load();
    }catch(e){}
};
(function(){
    if(window.ppdf){
        window.ppdf.signal = {
            client:                     null,                   //客户端
            /**
             * 建立通讯
             */
            connect:    function(){
                return new Promise(function(resolve, reject){
                    if(!window.ppdf.config && !window.ppdf.config.signal.server){
                        //读取配置文件失败
                        reject(new window.ppdf.Utils.Error(40011, "信号服务器未配置", null));
                    }else if(!window.WebSocket){
                        //不支持websocket
                        reject(new window.ppdf.Utils.Error(40012, "不支持websocket", null));
                    }else{
                        window.ppdf.signal.client = new WebSocket(window.ppdf.config.signal.server);
                        window.ppdf.signal.client.onerror = function(error) {
                            reject(new window.ppdf.Utils.Error(40013, "信号服务器连接失败", error));
                        };
                        window.ppdf.signal.client.onclose = function(e) {
                            reject(new window.ppdf.Utils.Error(40014, "信号服器连接被关闭", e));
                        };
                        window.ppdf.signal.client.onopen = function(){
                            resolve();
                        }
                    }
                });
            },
            /**
             * 接到消息该怎么处理
             * @callback(res)                  处理返回消息函数
             */
            onMessage:   function(callback){
                if(window.ppdf.signal.client){
                    window.ppdf.signal.client.onmessage = function(e){
                        callback(e.data);
                    };
                }
            },
            /**
             * 发送消息
             * @str                     发送的字符串
             */
            send:   function(str){
                if(!window.ppdf.signal.client || !str || typeof str != 'string'){
                    return false;
                }else{
                    window.ppdf.signal.client.send(str);
                }
            }
        };
    }
})();
(function(){
    if(window.ppdf){
        window.ppdf.Utils = {};
        /***
         * 循环
         * @objs                数组对象
         * @callback           回调函数
         * @index               下标，默认0
         */
        window.ppdf.Utils.loop = function(objs, callback, index){
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
                            return window.ppdf.Utils.loop(objs, callback, index + 1);
                        });
                }
            }
        };
        /*** 资源 ***/
        window.ppdf.Utils.resource = {
            //收集的资源形如
            // [{
            //      obj:        ,               //保存了这个元素
            //      url:        ,               //资源路径
            //      attr:       ,               //加载时设置的属性
            //
            // }, ..]
            resources:              [],
            /**
             * 收集资源（在含有ppdf属性的元素中， 收集存在src, data, param属性 且没有收集过的资源）
             */
            gather: function(){
                var objs = [];
                var i;
                var collection;
                //获取所有对象
                collection = document.getElementsByTagName("img");
                for(i = 0; i < collection.length; i++){
                    objs.push(collection[i]);
                }
                collection = document.getElementsByTagName("audio");
                for(i = 0; i < collection.length; i++){
                    objs.push(collection[i]);
                }
                collection = document.getElementsByTagName("video");
                for(i = 0; i < collection.length; i++){
                    objs.push(collection[i]);
                }
                collection = document.getElementsByTagName("source");
                for(i = 0; i < collection.length; i++){
                    objs.push(collection[i]);
                }
                collection = document.getElementsByTagName("object");
                for(i = 0; i < collection.length; i++){
                    objs.push(collection[i]);
                }
                collection = document.getElementsByTagName("param");
                for(i = 0; i < collection.length; i++){
                    objs.push(collection[i]);
                }
            },
        };

        //文件操作
        window.ppdf.Utils.file = {
            /**
             * 检测是否支持文件操作
             */
            isSupported: function(){
                if(window.Blob && window.FileReader){
                    return true;
                }else{
                    return false;
                }
            },
            /**
             * blob转二进制
             * @blob                二进制数据
             */
            blob2binary:  function(blob) {
              return new Promise(function(resolve, reject){
                var fileReader = new FileReader();
                fileReader.readAsArrayBuffer(blob);
                fileReader.onload = function(e) {
                  resolve(this.result);
                }
              });
            }
        };
        //ajax
        window.ppdf.Utils.ajax = {
            /**
             * 正规化方法（非法类型转为get）
             * @method                   ajax方法
             */
            normalizeMethod:   function(method){
                if(!method){
                    method = "GET";
                }else{
                    //过滤非正常参数
                    method = method.toUpperCase();
                    switch(method){
                        case "GET":
                        case "POST":
                            break;
                        default:
                            method = "GET";
                    }
                }
                return method;
            }
        };
        //url
        window.ppdf.Utils.url = {
            /**
             * 相对路径转绝对路径
             * @url                         路径
             */
            RelativeURL2AbsoluteURL:    function(url){
                if(!url){
                    //参数错误
                    return null;
                }else if(url.indexOf("http://") != -1 || url.indexOf("https://") != -1) {
                    //已经是绝对路径
                    return url;
                }else if((url.length >= 2 && url[0] == '/' && url[1] == '/')){
                    return "https:" + url;
                }else{
                    //是相对路径
                    var path = window.location.href;
                    path = path.substr(0, path.lastIndexOf('/'));
                    //重新组装
                    return path + url;
                }
            },
            /**
             * 是否有重复项
             * @urls                url数组
             */
            hasSameOne: function(urls){
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
            },
            /**
             * 去除重复url
             * @urls                 url数组
             */
            removeSame: function(urls){
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
            },
            /**
             * 获取服务器路径
             * @url                     绝对路径
             */
            getServer:  function(url){
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
            },
            /**
             * 拼装一个servlet的绝对路径
             * @server
             * @servletRelativePath
             */
            getServletAbsolutePath: function(server, servletRelativePath){
                if(server[server.length - 1] != '/'){
                    server = server + "/";
                }
                if(servletRelativePath[0] == '/'){
                    servletRelativePath = servletRelativePath.substring(1, servletRelativePath.length);
                }
                return server + servletRelativePath;
            }
        };
        /**
         * 构造错误对象
         * @code                             错误码（同HTTP状态吗）
         * @msg                              报错信息
         * @returnObj                       返回对象
         */
        window.ppdf.Utils.Error = function(code, msg, returnObj){
            return {
                code:                       code,
                msg:                        msg,
                returnObj:                  returnObj
            };
        };


        /*** 即将废弃的api ***/
        /**
         * 获取需要重新加载的数据
         */
        window.ppdf.Utils.getReloadSources = function(){
            var objs = [];
            var i;
            var collection;
            //获取所有对象
            collection = document.getElementsByTagName("img");
            for(i = 0; i < collection.length; i++){
                objs.push(collection[i]);
            }
            collection = document.getElementsByTagName("audio");
            for(i = 0; i < collection.length; i++){
                objs.push(collection[i]);
            }
            collection = document.getElementsByTagName("video");
            for(i = 0; i < collection.length; i++){
                objs.push(collection[i]);
            }
            collection = document.getElementsByTagName("source");
            for(i = 0; i < collection.length; i++){
                objs.push(collection[i]);
            }
            collection = document.getElementsByTagName("object");
            for(i = 0; i < collection.length; i++){
                objs.push(collection[i]);
            }
            collection = document.getElementsByTagName("param");
            for(i = 0; i < collection.length; i++){
                objs.push(collection[i]);
            }

            //整理成source结构
            var sources = [];
            for(i = 0; i < objs.length; i++){
                var obj = objs[i];
                var src = obj.getAttribute("src");
                var data = obj.getAttribute("data");
                var value = obj.getAttribute("value");
                //提取可能存在blob属性的元素
                if(src && src.length > 0){
                    //操作存在src属性的元素
                    sources.push({
                        obj:              obj,
                        src:              obj.src
                    });
                }else if(data && data.length > 4 && data.indexOf(".swf") == data.length - 4){
                    //操作data是swf文件的元素
                    sources.push({
                        obj:              obj,
                        data:             ppdf.Utils.url.RelativeURL2AbsoluteURL(data)
                    });
                }else if(value && value.length > 4 && value.indexOf(".swf") == value.length - 4){
                    //操作value是swf文件的元素
                    sources.push({
                        obj:              obj,
                        value:            ppdf.Utils.url.RelativeURL2AbsoluteURL(value)
                    });
                }
            }
            return sources;
        };
        /**
         * 中断默认加载
         * @sources     收集的元素
         */
        window.ppdf.Utils.cutDefaultLoad = function(sources){
            var i;
            for(i = 0; i < sources.length; i++){
                if(sources[i].src){
                    sources[i].obj.setAttribute("src", "");
                }else if(sources[i].data){
                    sources[i].obj.setAttribute("data", "");
                }else if(sources[i].value){
                    sources[i].obj.setAttribute("value", "");
                }
            }
        };
        /**
         * 恢复默认加载
         * @sources     收集的元素
         */
        window.ppdf.Utils.recoverDefaultLoad = function(sources){
            var i;
            for(i = 0; i < sources.length; i++){
                if(sources[i].src){
                    sources[i].obj.setAttribute("src", sources[i].src);
                }else if(sources[i].data){
                    sources[i].obj.setAttribute("data", sources[i].data);
                }else if(sources[i].value){
                    sources[i].obj.setAttribute("value", sources[i].value);
                }
            }
        };
    }
})();
(function(){
  /**
   * 元素
   * @obj         找到的dom目标
   * @type        元素类型，img、object、audio、video、source
   */
  function Element(obj){
    this.obj = obj;
    this.type = "img";
  }
  
  //注入模块
  window.ppdf.DomManager = {
    elements:               [],     //元素数组
  };
  
  
  /**
   * 开启资源配置
   * @callback2Add                  增加可捕捉资源
   * @callback2Delete
   */
  window.ppdf.DomManager.start = function(callback){
  
  };
  
  /**
   * 注入资源
   * @url                 url标示，用于定位资源
   * @resource            资源：blob、binaryarray或流式内容，可用于追加资源
   */
  window.ppdf.DomManager.inject = function(url, resource) {
    
  }
})();
(function(){
    if(window.ppdf){
        var manger = {
            pool:                   [],                     //连接池对象
        };


        //导出的对象
        window.ppdf.p2p = {
            //客户端
            /**
             * 初始化
             */
            check:   function(){
                return new Promise(function(resolve, reject){
                    if(!window.RTCPeerConnection && !window.webkitRTCPeerConnection && !window.mozRTCPeerConnection){
                        reject(new window.ppdf.Utils.Error(40021, "不支持P2P", null));
                    }else{
                        //var RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
                        //ppdf.p2p.client = new RTCPeerConnection(window.ppdf.config.p2p);
                        resolve();
                    }
                });
            },
            /**
             * 构建描述对象
             */
            startDesc:  function(){
                return new Promise(function(resolve, reject){
                    if(!ppdf.p2p.client){
                        reject(new ppdf.Utils.Error(40022, "没有创建客户端", null));
                    }else{
                        ppdf.p2p.client.createOffer().then(
                            function gotDescription(desc){
                                //保存描述
                                ppdf.p2p.client.setLocalDescription(desc);
                                //传递自我描述
                                resolve(desc);
                            },
                            function onCreateSessionDescriptionError(error){
                                reject(new ppdf.Utils.Error(40023, "发起连接请求失败", error));
                            }
                        );
                    }
                });
            },
            /**
             * 发起连接
             * @websocket                       websocket连接对象
             */
            connect:    function(websocket){
                return new Promise(function(resolve, reject){
                    if(!websocket){
                        reject(new ppdf.Utils.Error(40022, "没有打开信道服务器", null));
                    } else if(!ppdf.p2p.client){
                        reject(new ppdf.Utils.Error(40023, "没有创建客户端", null));
                    }else{
                        ppdf.p2p.client.createOffer().then(
                            function gotDescription(desc){
                                //保存描述
                                ppdf.p2p.client.setLocalDescription(desc);
                                //进入下一个状态
                                resolve(desc);
                                //通知接受方自己的描述
                                //remoteConnection.setRemoteDescription(desc);
                                //remoteConnection.createAnswer().then(
                                //    gotDescription2,
                                //    onCreateSessionDescriptionError
                                //);
                            },
                            function onCreateSessionDescriptionError(error){
                                reject(new ppdf.Utils.Error(40024, "发起连接请求失败", error));
                            }
                        );
                    }
                });
            },

            //发送
            send:{
                channel:                null,
                send:                   null,

                /**
                 * 通道状态改变时执行的操作
                 */
                onChannelStateChange:   function(){
                    if(ppdf.p2p.send.channel && ppdf.p2p.send.channel.readyState && ppdf.p2p.send.channel.readyState == "open"){

                    }
                },
                /**
                 * 注册该操作什么数据
                 */
                register: function(){

                }
            },
            //接受
            receive:{
                channel:                null,
            },





            /*** 测试的代码 ***/
            test:{
                /**
                 * 获取客户端
                 */
                getClient:  function(){
                    var RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
                    //return new RTCPeerConnection(window.ppdf.config.p2p);
                    return new RTCPeerConnection(null, null);
                },
                /**
                 * 构建描述对象
                 * @client
                 */
                startDesc:  function(client){
                    return new Promise(function(resolve, reject){
                        client.createOffer().then(
                            function gotDescription(desc){
                                //保存描述
                                client.setLocalDescription(desc);
                                //传递自我描述
                                resolve(desc);
                            },
                            function onCreateSessionDescriptionError(error){
                                reject(new ppdf.Utils.Error(40023, "发起连接请求失败", error));
                            }
                        );
                    });
                },
                /**
                 * 响应描述
                 * @client
                 * @desc
                 */
                answerDesc: function(client, desc){
                  console.log("接收描述");
                  console.log(desc);
                  
                  return new Promise(function(resolve, reject){
                    client.setRemoteDescription(desc);
                    client.createAnswer().then(
                      function(desc){
                        //保存desc
                        client.setLocalDescription(desc);
                        //进入下一个状态
                        resolve(desc);
                      },
                      function onCreateSessionDescriptionError(error){
                        reject(new ppdf.Utils.Error(40023, "发起连接请求失败", error));
                      }
                    );
                  });
                },
                /**
                 * 保存远程描述
                 * @client
                 * @desc
                 */
                storeRemoteAnswerDesc: function(client, desc){
                  return new Promise(function(resolve, reject){
                    client.setRemoteDescription(desc);
                    resolve();
                  });
                }
            }
        };
    }
})();
//客户端
window.ppdf.p2p.PeerClient = function(){
    var RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
    this.obj = new RTCPeerConnection(window.ppdf.config.p2p);
};
/**
 * 准备描述对象
 */
window.ppdf.p2p.PeerClient.prototype.startDesc = function(){
  return new Promise(function(resolve, reject){
      ppdf.p2p.client.createOffer().then(
          function gotDescription(desc){
              //保存描述
              ppdf.p2p.client.setLocalDescription(desc);
              //传递自我描述
              resolve(desc);
          },
          function onCreateSessionDescriptionError(error){
              reject(error);
          }
      );
  });
};
/**
 *
 */

(function(){
    /*** 立刻执行的操作 ***/
    //尝试阻止刷新页面
    //ppdf.ConfigRefreshAndClose.startConfig("页面尚未加载完毕，退出可能造成错误。您确认要退出吗？");

    //变量
    var sources;                                                        //dom树中所有资源
    var resourceCatalog = {
        obj:                    null,                                   //资源索引
        maybeUpdate:            [],                                     //可能要更新的
        needDownload:           []                                      //需要下载的（含需要更新的）
    };

    //p2p客户端
    var p2pClient = window.ppdf.p2p.test.getClient();
    var needResourceURL;                                                //需要的资源路径
    var targetAddress;
    var sendChannel;
    var receiveChannel;
    //收到候选信息后执行的操作
    p2pClient.onicecandidate = function(e) {
      //如果构造出来了候选客户端，则发送
      if(e.candidate){
        console.warn("目标地址");
        console.log(targetAddress);
        console.warn("发送候选信息");
        //console.log(e.candidate);
        //构造信息
        var msg = {
          code:                 3005,
          data:{
            target: {
              address:          targetAddress
            },
            candidate:          e.candidate
          }
        };
        //发送
        window.ppdf.signal.send(JSON.stringify(msg));
        console.log(msg);
      }
    };


    //接受信号时该如何处理
    function OnSignal(txt){
        var i, j, k, l, m, n;
        var url;
        var array;
        var server;
        var source;
        var attribute;

        var data;
        var md5;

        var res = JSON.parse(txt);
        //根据返回码操作
        switch(res.code){
            //丢弃资源
            case 1001:
                console.log("服务器指令1001");
                console.log(res.data);
                /*** 操作目录 ***/
                //1.丢弃本地这些资源
                ppdf.Utils.loop(res.data, function(index, url, next){
                    //删除资源
                    ppdf.database.deleteData(url).then(function(){
                        next();
                    }).catch(function(e){
                        next();
                    });
                });
                //2.根据返回结果，去除内存目录中的数据
                for(i = 0; i < res.data.length; i++){
                    for(j = 0; j < resourceCatalog.obj.length; j++){
                        //删除目录中丢失的资源
                        if(resourceCatalog.obj[j].url == res.data[i].url){
                            resourceCatalog.obj.splice(j, 1);
                            break;
                        }
                    }
                }
                /*** 获取当前页面中 可能需要下载 & 需要下载的资源 ***/
                //目录中不存在，则视为需要下载；存在，视为可能需要下载
                for(i = 0; i < sources.length; i++) {
                    url = sources[i].src || sources[i].value || sources[i].data;
                    //比对文件
                    if(resourceCatalog.obj.length <= 0){
                        //本地不存在缓存，所有文件都需要下载
                        resourceCatalog.needDownload.push(url);
                    }else{
                        //本地存在缓存，挨个检查
                        for(j = 0; j < resourceCatalog.obj.length; j++){
                            if(url == resourceCatalog.obj[j].url){
                                //资源本地存在缓存，可能需要下载
                                resourceCatalog.maybeUpdate.push(url);
                                break;
                            }else if(j == resourceCatalog.obj.length - 1){
                                //资源本地不存在，需要下载
                                resourceCatalog.needDownload.push(url);
                            }
                        }
                    }
                }

                //获取列表完毕，去除重复项目
                ppdf.Utils.url.removeSame(resourceCatalog.maybeUpdate);
                ppdf.Utils.url.removeSame(resourceCatalog.needDownload);
                //去除无法获取服务器的项目
                for(i = 0; i < resourceCatalog.maybeUpdate.length; i++){
                    server = ppdf.Utils.url.getServer(resourceCatalog.maybeUpdate[i]);
                    if(!server){
                        resourceCatalog.maybeUpdate.splice(i, 1);
                        i--;
                    }
                }
                for(i = 0; i < resourceCatalog.needDownload.length; i++){
                    server = ppdf.Utils.url.getServer(resourceCatalog.needDownload[i]);
                    if(!server){
                        resourceCatalog.needDownload.splice(i, 1);
                        i--;
                    }
                }
                console.log("资源目录");
                console.log(resourceCatalog);

                //循环检查可能需要更新列表：与资源服务器通讯检查md5，检查是否需要更新
                array = resourceCatalog.maybeUpdate;
                ppdf.Utils.loop(array, function(index, url, next){
                    var server = ppdf.Utils.url.getServer(url);
                    var servlet_md5 = ppdf.Utils.url.getServletAbsolutePath(server, ppdf.config.resource.servlet.md5);
                    ppdf.ajax.get(servlet_md5 + "?url=" + url, "json").then(function(res){
                        //检查md5，如果本地存储不一致，则把这个url添加到需要下载的路径
                        for(i = 0; i < resourceCatalog.obj.length; i++){
                            //找到这个元素执行操作
                            if(resourceCatalog.obj[i].url == url){
                                if(resourceCatalog.obj[i].md5 != res.data.md5){
                                    //md5不一致，则添加到下载列表
                                    resourceCatalog.needDownload.push(url);
                                }else{
                                    //md5一致，则直接显示
                                    console.log("直接显示的数据" + url);
                                    data = ppdf.database.getData(url).then(function(res){
                                        var i;
                                        var localurl;
                                        //本地读取成功
                                        //把数据显示出来
                                        //显示界面
                                        data = window.URL.createObjectURL(res.data);
                                        //找到source
                                        for(i = 0; i < sources.length; i++){
                                            localurl = sources[i].src || sources[i].value || sources[i].data;
                                            if(sources[i].src){
                                                attribute = "src";
                                            }
                                            if(sources[i].value){
                                                attribute = "value";
                                            }
                                            if(sources[i].data){
                                                attribute = "data";
                                            }
                                            if(localurl == url){
                                                sources[i].obj.setAttribute(attribute, data);
                                            }
                                        }
                                    }).catch(function(e){
                                        //本地读取失败
                                        //把这个资源添加到下载列表
                                        resourceCatalog.needDownload.push(url);
                                    });
                                }
                                break;
                            }
                        }
                        next();
                    }).catch(function(error){
                        //获取不到md5值，把这个资源添加到下载列表
                        resourceCatalog.needDownload.push(url);
                        next();
                    });
                }).then(function(){
                    //所有需要下载的资源配置完毕
                    console.log("所有需要下载的资源配置完毕");
                    console.log(resourceCatalog);
                    //清空可能需要下载目录
                    resourceCatalog.maybeUpdate = [];
                    //询问服务器是否有客户端可提供下载
                    var msg = {
                        code:               3002,
                        data:               resourceCatalog.needDownload
                    };
                    ppdf.signal.send(JSON.stringify(msg));
                    console.log("询问服务器是否有资源可以下载");
                    console.log(msg);
                });

                break;
            //收到可用的客户端
            case 1002:
                console.log("服务器指令1002");
                console.log(res.data);
                /*** 无法P2P提供的资源需要ajax下载 ***/
                for(i = 0; i < res.data.notFindResources.length; i++){
                    ppdf.ajax.acquireBlob({
                        url:            res.data.notFindResources[i],
                        callbackParam:  "ajax",
                        success:        function(ajax){
                            //保存数据
                            md5 = ajax.getResponseHeader("md5");
                            url = ajax.responseURL;
                            if(md5 && url){
                                data = ajax.response;
                                ppdf.database.addData({url: url, md5: md5, data: data});
                            }

                            //显示界面
                            data = window.URL.createObjectURL(ajax.response);
                            //找到source
                            for(i = 0; i < sources.length; i++){
                                //console.log(sources);
                                url = sources[i].src || sources[i].value || sources[i].data;
                                if(sources[i].src){
                                    attribute = "src";
                                }
                                if(sources[i].value){
                                    attribute = "value";
                                }
                                if(sources[i].data){
                                    attribute = "data";
                                }
                                if(url == ajax.responseURL){
                                    sources[i].obj.setAttribute(attribute, data);
                                }
                            }
                        }
                    });
                }
                /*** P2P可用的资源找对应的客户端要下载 ***/
                //把对应的资源询问
                // for(i = 0; i < res.data.reqs.length; i++){
                //
                // }
                //如果不够则不发送
                if(res.data.reqs.length <= 0){
                  return;
                }
                
                //向对方发送索取数据请求
                var msg = {
                  code:       3201,
                  data: {
                    target: {
                      address: res.data.reqs[0].clients[0]
                    }
                  }
                };
                window.ppdf.signal.send(JSON.stringify(msg));
                console.warn("发送数据索取请求");
                console.log(msg);
                break;
            //收到请求描述信息
            case 1003:
                //保存请求地址
                targetAddress = res.data.source.address;
              
                //构建接受通道
                p2pClient.ondatachannel = function(e) {
                  //保存数据通道
                  receiveChannel = e.channel;
                  receiveChannel.binaryType = 'arraybuffer';
                  receiveChannel.onmessage = function(e){
                    //console.log(e);
                    console.warn("接收到p2p数据");
                    var blob = new Blob([event.data]);
                    var data = window.URL.createObjectURL(blob);
                    //找到source
                    sources[0].obj.setAttribute('src', data);
                  }
                };
              
                //保存描述
                window.ppdf.p2p.test.answerDesc(p2pClient, res.data.desc).then(function(desc){
                  console.warn("响应描述");
                  console.log(desc.sdp);
                  //把对应的p2p客户端发送到服务器
                  var msg = {
                    code:           3004,
                    data: {
                      target:{
                        address:    res.data.source.address
                      },
                      desc:         desc
                    }
                  };
                  window.ppdf.signal.send(JSON.stringify(msg));
                  console.warn("发送响应描述");
                  console.warn(msg);
                  console.log("提供者");
                  console.log(p2pClient);
                }).catch(function(e){
                  console.error("保存描述信息错误");
                  console.error(e);
                });
                break;
            //收到响应描述
            case 1004:
                console.warn("接收到响应描述");
                //保存响应描述
                window.ppdf.p2p.test.storeRemoteAnswerDesc(p2pClient, res.data.desc).then(function(){
                  console.log("成功");
                  console.log(p2pClient);
                });
                break;
            //收到候选信息
            case 1005:
                console.warn("*****接收到候选信息");
                console.log(res.data.candidate);
                //把icecandidate添加到自己
                p2pClient.addIceCandidate(res.data.candidate);
                break;
            //收到数据索取请求
            case 1201:
                //保存目标地址
                targetAddress = res.data.source.address;
              
                //发起p2p请求
                //建立数据传输通道
                sendChannel = p2pClient.createDataChannel('sendDataChannel');
                sendChannel.binaryType = 'arraybuffer';
                sendChannel.onopen = function(e){
                  var readyState = sendChannel.readyState;
                  if (readyState === 'open') {
                    console.error("准备发送数据");
                    window.ppdf.database.getData("http://192.168.50.158:10000/img/1.jpeg").then(function(dbRes){
                      console.log(dbRes);
                      //转成二进制发送
                      window.ppdf.Utils.file.blob2binary(dbRes.data).then(function(binaryData){
                        sendChannel.send(binaryData);
                      });
                    });
                  }
                };
                sendChannel.onclose = function(e){
                  var readyState = sendChannel.readyState;
                };
                
                console.log("创建数据通道");
                console.log(sendChannel);
                //构建发起描述
                window.ppdf.p2p.test.startDesc(p2pClient).then(function(desc){
                    console.warn("请求描述");
                    console.log(desc.sdp);
                    //把对应的p2p客户端发送到服务器
                    var msg = {
                      code:           3003,
                      data: {
                        target:{
                          address:    res.data.source.address
                        },
                        desc:         desc
                      }
                    };
                    window.ppdf.signal.send(JSON.stringify(msg));
                    console.warn("发送本地描述");
                    console.warn(msg);
                }).catch(function(e){
                    console.error('p2p通讯故障');
                    console.error(e);
                });
                break;
        }
    }


    //如果支持文件操作，则尝试展开PPDF框架
    if(window.ppdf.Utils.file.isSupported()){
        /*** dom ready执行操作 ***/
        ppdf.DomReady.ready(function(){
            //中断所有数据的加载
            sources = ppdf.Utils.getReloadSources();
            ppdf.Utils.cutDefaultLoad(sources);
            //初始化ajax
            ppdf.ajax.init().then(function(){
                console.log("ajax，初始化成功；尝试连接信号服务器，准备开始加速传输");
                //ajax，初始化成功；尝试连接信号服务器，准备开始加速传输
                return ppdf.signal.connect();
            }).then(function(){
                console.log("信号服务器连接成功，注册接受函数");
                //信号服务器连接成功，注册接受函数
                ppdf.signal.onMessage(OnSignal);
                //检查P2P
                console.log("检查p2p");
                return ppdf.p2p.check();
            }).then(function(){
                //尝试开启本地数据库存储
                return ppdf.database.initDB();
            }).then(function(){
                //数据库开启成功，获取所有数据（目录结构）
                return ppdf.database.getAllData();
            }).then(function(catalog){
                if(!catalog){
                    //此时发生数据读取错误，则开启恢复传统加载模式
                    ppdf.Utils.recoverDefaultLoad(sources);
                }else{
                    //保存资源索引
                    resourceCatalog.obj = catalog;
                    //通知信号服务器本地存储情况
                    var msg = {
                        code:               3001,
                        data:               catalog
                    };
                    ppdf.signal.send(JSON.stringify(msg));
                    //
                    console.log("*** 通知服务器本地资源情况 ***");
                    console.log(msg);
                    console.log("*** 通知服务器本地资源情况 ***");
                }
            }).catch(function(error){
                console.log("*** 发生错误 ***");
                console.log(error);
                console.log("*** 发生错误 ***");

                //根据错误码操作
                switch(error.code){
                    case 40011:
                    case 40012:
                    case 40013:
                    case 40014:
                        //信号服务器无法正常通讯，恢复传统加载模式
                        ppdf.Utils.recoverDefaultLoad(sources);
                        console.log(error);
                        break;
                    case 40021:
                        //P2P传输无法开启，恢复传统加载模式
                        ppdf.Utils.recoverDefaultLoad(sources);
                        console.log(error);
                        break;
                    case 40031:
                        return;
                    case 40032:
                        //出现数据库无法打开 或 数据库升级失败的情况，恢复传统加载模式
                        ppdf.Utils.recoverDefaultLoad(sources);
                        console.log(error);
                        break;
                    case 40033:
                    case 40034:
                    case 40035:
                        break;
                    case 40041:
                    case 40042:
                        //ajax无法开启，恢复传统加载模式
                        ppdf.Utils.recoverDefaultLoad(sources);
                        console.log(error);
                        break;
                }
            });
        });
    }
})();