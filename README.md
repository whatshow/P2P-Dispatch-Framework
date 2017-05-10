# P2P-Dispatch-Framework（前端框架）
P2P分发框架（前端框架）


# 一、引用方式（仅支持UTF8字符集）
把ppdf文件夹放到服务器根目录，所有页面文件的head标签内添加如下标签：

<script src="ppdf/modules/es6-promise/es6-promise.auto.min.js"></script>
<script src="ppdf/modules/filer/filer-0.0.43-min.js"></script>
<script src="ppdf/modules/spark-md5/spark-md5.min.js"></script>

<script src="ppdf/index.js"></script>
<script src="ppdf/config.js"></script>
<script src="ppdf/libs/Utils.js"></script>
<script src="ppdf/libs/Signal.js"></script>
<script src="ppdf/libs/P2P.js"></script>
<script src="ppdf/libs/Database.js"></script>
<script src="ppdf/ConfigRefreshAndClose.js"></script>
<script src="ppdf/libs/ajax.js"></script>
<script src="ppdf/libs/DomReady.js"></script>
<script src="ppdf/start.js"></script>


# 二、模块解析
 filer-0.0.43-min.js                                           实现ppdf框架源代码

 modules
 |  filer-0.0.43-min.js                                        拓展包的前置js
 |
 |  ajax                                                       ajax依赖包
 |  DomReady                                                   DomReady监听依赖包(dom加载完立刻执行，不管其它资源是否下载完；不同于window.onload)


# 三、浏览器版本兼容性

3.1 filer.js 的兼容性

    node.js: v0.10.*+
    IE: 10+ (IndexedDB)
    Firefox: 26+ (IndexedDB)
    Chrome: 31+ (IndexedDB, WebSQL)
    Safari: 7.0+ (WebSQL)
    Opera: 19+ (IndexedDB, WebSQL)
    iOS: 3.2+ (WebSQL)
    Android Browser: 2.1-4.4 (WebSQL), 4.4+ (IndexedDB)


# 四、WebRTC说明
    4.1 API
    partial interface RTCDataChannel : EventTarget {
        Promise send (DOMString data);
        Promise send (Blob data);
        Promise send (ArrayBuffer data);
        Promise send (ArrayBufferView data);
    }