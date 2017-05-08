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