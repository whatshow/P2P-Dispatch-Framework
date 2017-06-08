import Config from '../config'
import Promise from '../../modules/es6-promise/es6-promise.auto.min';
import {Error} from './Error/Error';

//客户端
let client = null;
//控制器（其实都是回调函数）
let controllers = [];

export class Signal{
  
  static check(){
    if(!window.WebSocket){
      return true;
    }else{
      return false;
    }
  };
  
  static connect = () => {
    return new Promise((resolve, reject) => {
      if (!Config && !Config.signal.server) {
        //读取配置文件失败
        reject(new Error(400111, "信号服务器未配置", null));
      } else if (!this.check()) {
        //不支持websocket
        reject(new Error(400112, "不支持websocket", null));
      } else {
        client = new WebSocket(Config.signal.server);
        client.onerror = (error) => {
          client = null;
          reject(new Error(40013, "信号服务器连接失败", error));
        };
        client.onclose = function(e) {
          client = null;
          reject(new Error(40014, "信号服器连接被关闭", e));
        };
        client.onopen = function() {
          resolve();
        }
      }
    });
  };
  
  /**
   * 增加消息处理函数
   * @callback                回调函数
   */
  static addController = (callback) => {
    //增加处理函数
    controllers.push(callback);
    //增加调用
    if (client) {
      client.onmessage = (e) => {
        let param;
        try{
          param = JSON.parse(e.data);
        }catch(e){
          param = e.data;
        }
        //执行参数
        for (let i = 0; i < controllers.length; i++) {
          controllers[i](param);
        }
      }
    }
  };

  /**
   * 删除调用
   * @index                   第index个函数，index从0开始计算
   */
  static removeController = (index) => {
    if (index >= 0 && index < controllers.length) {
        //删除处理函数
        controllers.splice(index, 1);
        //重新添加绑定
        if (client) {
            client.onmessage = function(e) {
                for (let i = 0; i < controllers.length; i++) {
                    controllers[i](e.data);
                }
            }
        }
    }
  };
  /**
   * 获取所有控制器
   */
  static getAllControllers = () => {
    return controllers;
  };
  /**
   * 删除所有控制器
   */
  static removeAllControllers = () => {
    controllers = [];
    if (client) {
        client.onmessage = (e) => {
            //不做任何处理
        }
    }
  };
  /**
   * 发送消息
   * @str                     发送的字符串
   */
  static send = (str) => {
    if (!client || !str) {
        return false;
    } else {
        client.send(str);
    }
  }
}