export class Error{
  /**
   * 构造错误对象
   * @code                              错误码（同HTTP状态吗）
   * @msg                               报错信息
   * @returnObj                         返回对象
   */
  constructor(code, msg, returnObj){
    this.code = code;
    this.msg = msg;
    this.returnObj = returnObj;
  }
}