import Error from "./Error/Error";
import Promise from 'es6-promise';

//配置
let config = {
    name:      "ppdf-data",
    obj:       null,
    tables:{
        data:{
            name: "data"
        }
    }
};
//数据库对象
let db = null;

export class Database{
  /**
   * 检查是否支持
   */
  static check(){
    return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB;
  };
  
  /**
   * 初始化数据库
   * @resolve(database)                           获取数据库对象
   * @reject(error)                               获取报错信息
   */
  static initDB(){
    return new Promise((resolve, reject) => {
      let indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB;
      let reqDB;
      reqDB = indexedDB.open(config.name, 1);
      reqDB.onerror = (e) => {
        //说明本地数据库已经存在，尝试重新打开
        reqDB = null;
        reqDB = indexedDB.open(config.name, 2);
        reqDB.onsuccess = (e) => {
          db = reqDB.result;
          resolve();
        };
        reqDB.onerror = (e) => {
          //数据库依旧打不开，错误未知
          reject(new Error(400311,  "数据库无法创建（原因未知）", e));
        }
      };
      reqDB.onsuccess = (e) => {
        //关闭数据库，重新打开升级数据库，尝试添加表
        reqDB.result.close();
        reqDB = null;
        reqDB = indexedDB.open(config.name, 2);
        reqDB.onupgradeneeded = function(e){
          reqDB.result.createObjectStore(config.tables.data.name, {keyPath:"url"});
        };
        reqDB.onsuccess = (e) => {
          db = reqDB.result;
          resolve();
        };
        reqDB.onerror = (e) => {
          //升级数据库失败
          reject(new Error(400312, "升级数据库失败", e));
        };
      };
    });
  };
  
  /**
   * 获取所有数据
   * @type                            类型：all：含有blob类型的数据, catalog：不含有blob类型的数据，默认是catalog
   */
  static getAllData(type){
    return new Promise((resolve, reject) => {
      let reqCursor;
      let transaction_getAllData;
      let objectStore;
      let cursor;
      let data = [];
      
      if(!db){
        reject(new Error(400321, "数据库未打开", null));
      } else{
        //尝试打开游标
        transaction_getAllData = db.transaction([config.tables.data.name], "readonly");
        objectStore = transaction_getAllData.objectStore(config.tables.data.name);
        reqCursor = objectStore.openCursor();
        reqCursor.onerror = (e) => {
          //打开游标失败，失败
          reject(new Error(400322, "游标打开失败", e));
        };
        reqCursor.onsuccess = (e) => {
          cursor = e.target.result;
          if(cursor){
            //有数据，读取
            if(!type || type === "catalog"){
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
  };
  
  /**
   * 添加数据
   * @data                    数据
   */
  static addData = (data) =>{
    return new Promise((resolve, reject) => {
      let transaction;
      let objectStore;
      let reqAdd;
      
      if(! db){
        reject(new Error(400331, "数据库未创建", null));
      }else if(!data){
        reject(new Error(400332, "数据传入为空", null));
      }else{
        transaction =  db.transaction([config.tables.data.name], "readwrite");
        objectStore = transaction.objectStore(config.tables.data.name);
        reqAdd = objectStore.put(data);
        reqAdd.onerror = (e) => {
          reject(new Error(400333, "数据添加失败", e));
        };
        reqAdd.onsuccess = () => {
          //数据添加成功
          resolve(data);
        };
      }
    });
  };
  
  /**
   * 删除一条数据
   * @url                 数据连接
   */
  static deleteData = (url) => {
    let transaction;
    let objectStore;
    let reqDelete;
  
    return Promise((resolve, reject) => {
      if(! db) {
        reject(new Error(400341, "数据库未创建", null));
      }else if(!url){
        reject(new Error(400342, "数据地址没有传入", null));
      }else{
        transaction = db.transaction([config.tables.data.name], "readwrite");
        objectStore = transaction.objectStore(config.tables.data.name);
        reqDelete = objectStore.delete(url);
        reqDelete.onerror = (error) => {
          reject(new Error(400343, "删除数据失败", error));
        };
        reqDelete.onsuccess = (e) =>{
          resolve();
        };
      }
    });
  };
  
  /**
   * 获取一条数据
   * @url
   */
  static getData = (url) => {
    let transaction;
    let objectStore;
    let reqGet;
    
    return new Promise((resolve, reject) => {
      if(! db) {
        reject(new Error(400351, "数据库未创建", null));
      }else if(!url) {
        reject(new Error(400352, "数据地址没有传入", null));
      }else{
        transaction = db.transaction([config.tables.data.name], "readonly");
        objectStore = transaction.objectStore(config.tables.data.name);
        reqGet = objectStore.get(url);
        reqGet.onerror = (e) => {
          reject(new Error(400353, "数据不存在", e));
        };
        reqGet.onsuccess = (e) => {
          resolve(e.target.result);
        };
      }
    });
  }
}