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
                if(window.Blob){
                    return true;
                }else{
                    return false;
                }
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