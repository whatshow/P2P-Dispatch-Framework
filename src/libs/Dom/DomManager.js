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