/**
 * 构造错误对象
 * @code                              错误码（同HTTP状态吗）
 * @msg                               报错信息
 * @returnObj                         返回对象
 */
window.ppdf.Error = function(code, msg, returnObj){
  return {
    code:                       code,
    msg:                        msg,
    returnObj:                  returnObj
  };
};