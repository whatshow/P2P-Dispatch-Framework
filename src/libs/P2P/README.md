# P2P模块

## PeerClientPool.js
* 说明：p2p线程池模块－提供P2P线程池，用于执行任务

* 模块解读：
    * 模块配置

    * 初始化

    * 增加任务

## Mission.js
* 说明：任务模块－用于执行下载任务

* 模块解读
    * 构造方法

            /**
             * @url                 资源url标识
             * @md5                 资源md5值
             * @succeed             成功回调（返回资源对象）
             * @fail                失败回调
             */
            window.ppdf.p2p.Mission(url, md5, succeed, fail)