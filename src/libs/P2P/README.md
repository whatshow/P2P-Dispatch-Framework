# P2P模块

## 一、P2P.js
### 介绍
p2p模块最终封装结果，提供接口给其它模块

## 二、PeerClientPool.js
### 介绍
p2p线程池模块－提供P2P线程池，用于执行任务

### 模块解读：
* 模块配置

* 初始化

* 增加任务

## 三、PeerClient.js
### 介绍
p2p客户端对象，提供给PeerClientPool.js操作

### 模块解读
* 构造方法
    * 参数
        * live 生存时间，默认3000ms
    * 调用

        window.ppdf.p2p.PeerClient();

* 设置释放客户端（不传递参数时，根据自身的live属性设置）
    * 参数
        * timeout：对应毫秒后释放this.obj
    * 调用：

        peerClient.setRelease(timeout);

* 中断释放客户端

    peerClient.cutRelease();

* 是否为空（obj对象是否为null）

    peerClient.isEmpty();

* 重新构造客户端

    peerClient.rebuild();

* 本地描述信息是否匹配
    * 参数
        * desc 描述对象
    * 调用

        peerClient.hasLocalDesc(desc);

* 绑定任务
    * 参数
        * mission 任务对象
    * 调用

        peerClient.bindMission(mission);

* 目标地址是否匹配
    * 参数
        * targetAddress 目标IP地址（支持IPv4 & IPv6）
    * 调用

        peerClient.hasTargetAddress(targetAddress);

* 绑定目标
    * 参数
        * targetAddress 目标IP地址（支持IPv4 & IPv6）
    * 调用

        peerClient.bindTarget(targetAddress)

* 准备描述对象
    * 调用

            peerClient.createOffer().then(function(desc){
                //获取了描述信息
                desc;
            }).catch(function(error){
                //错误
            });

* 响应描述
    * 参数
        * desc
    * 调用

            peerClient.answerDesc(desc).then(function(desc){
                //获取了描述信息
                desc;
            }).catch(function(error){
                //错误
            });

* 保存响应描述
    * 参数
        * desc 描述信息
    * 调用

        peerClient.storeAnswerDesc(desc);

* 注入候选信息时回调
    * 参数
        * callback(candidate)       处理候选信息的回调
    * 调用

        peerClient.setOnIceCandidate(callback);

## 四、Mission.js
### 介绍
任务模块－用于执行下载任务

### 模块解读
* 构造方法

        /**
         * @url                 资源url标识
         * @md5                 资源md5值
         * @succeed             成功回调（返回资源对象）
         * @fail                失败回调
         */
        window.ppdf.p2p.Mission(url, md5, succeed, fail)