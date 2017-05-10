# P2P-Dispatch-Framework（前端框架）
P2P分发框架（前端框架）


# 一、引用方式（仅支持UTF8字符集）
把ppdf文件夹放到服务器根目录，所有页面文件的head标签内添加如下标签：

        <script src="ppdf/modules/es6-promise/es6-promise.auto.min.js"></script>
        <script src="ppdf/modules/spark-md5/spark-md5.min.js"></script>
        <script src="ppdf/dist/built.min.js"></script>

# 二、模块解析
暂无

# 三、浏览器版本兼容性

3.1 node版本
node.js: v0.10.*+

3.2 游览器数据库

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