(function(){
  /**
   * 构造一个新任务
   * @url                 资源
   * @md5                 资源md5值
   * @succeed             成功回调
   * @fail                失败回调
   */
  window.ppdf.p2p.Mission = function(url, md5, succeed, fail){
    this.url = url;
    this.md5 = md5;
    this.succeed = succeed;
    this.fail = fail;
  };
  
  /**
   * 开始任务
   */
  window.ppdf.p2p.Mission.prototype.do = function(){
  };
})();