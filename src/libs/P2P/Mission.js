(function(){
  /**
   * 构造一个新任务
   * @url                 资源(唯一标示一个资源，)
   * @md5                 资源md5值
   * @targetAddressList   数据源数组
   * @succeed             成功回调
   * @fail                失败回调
   */
  window.ppdf.p2p.Mission = function(url, md5, targetAddressList, succeed, fail){
    this.url = url;
    this.md5 = md5;
    this.targetAddressList = targetAddressList;
    this.curTargetAddressIndex = -1;                   //当前采用的数据提供者
    this.succeed = succeed;
    this.fail = fail;
  };
  
  /**
   * 获取下一个数据提供者地址
   */
  window.ppdf.p2p.Mission.prototype.getNextProviderAddress = function(){
    //移动游标
    this.curTargetAddressIndex++;
    
    //检查是否有值
    if(this.targetAddressList && this.curTargetAddressIndex < this.targetAddressList.length){
      //返回真实值
      return this.targetAddressList[this.curTargetAddressIndex];
    }else{
      //没有结果
      return null;
    }
  };
})();