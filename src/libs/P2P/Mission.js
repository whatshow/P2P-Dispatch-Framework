(function(){
  /**
   * 任务－数据结构，用于描述获取一个资源的所有必备信息
   *
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
    this.succeed = function(){
      succeed();
      //清除所有信息，防止多次执行
      this.clear();
    };
    this.fail = function(){
      fail();
      //清除所有信息，防止多次执行
      this.clear();
    }
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
  
  /**
   * 释放所有信息
   */
  window.ppdf.p2p.Mission.prototype.clear = function(){
    this.url = null;
    this.md5 = null;
    this.targetAddressList = null;
    this.curTargetAddressIndex = -1;
    this.succeed = null;
    this.fail = null;
  }
})();