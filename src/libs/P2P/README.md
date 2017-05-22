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

window.ppdf.p2p.PeerClient();

* 设置释放客户端（不传递参数时，默认3000毫秒释放）
    * 参数
        * timeout：对应毫秒后释放this.obj
    * 调用：

    peerClient.setRelease(timeout);

* 中断释放客户端

peerClient.cutRelease();

* 是否为空（obj对象是否为null）



* 重新构造客户端

* 本地描述信息是否匹配

* 绑定任务

* 目标地址是否匹配

* 绑定目标

* 准备描述对象

* 响应描述

* 保存响应描述

* 注入候选信息时回调

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