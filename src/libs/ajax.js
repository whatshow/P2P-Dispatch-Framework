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
             * 检查是否支持ajax
             */
            check:  function(){
              if(window.ActiveXObject){
                var ieAjaxTypes = ["MSXML2.XMLHttp.6.0","MSXML2.XMLHttp.5.0", "MSXML2.XMLHttp.4.0","MSXML2.XMLHttp.3.0","MSXML2.XMLHttp","Microsoft.XMLHttp"];
                for(var ieAjaxTypes_index = 0; ieAjaxTypes_index < ieAjaxTypes.length; ieAjaxTypes_index++) {
                  try{
                    window.ppdf.ajax.xmlhttp = new ActiveXObject(ieAjaxTypes[ieAjaxTypes_index]);
                    return true;
                  }catch(e){}
                }
              }else{
                try {
                  window.ppdf.ajax.xmlhttp = new XMLHttpRequest();
                  return true;
                }catch(e){
                  //执行到此说明无论如何都无法开启ajax
                  return false;
                }
              }
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