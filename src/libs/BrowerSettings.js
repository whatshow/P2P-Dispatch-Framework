module.exports = {
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