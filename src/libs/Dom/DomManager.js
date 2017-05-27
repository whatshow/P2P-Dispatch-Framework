// (function () {
//   /**
//    * 元素
//    * @obj         找到的dom目标
//    * @type        元素类型，img、object、param、audio、video、source
//    */
//   function Element(obj) {
//     this.obj = obj;
//     this.type = "img";
//   }
//
//   //注入模块
//   window.ppdf.DomManager = {
//     elements: [],     //元素数组
//   };
//
//
//   /**
//    * 开启资源配置
//    * @callback2Add                  增加可捕捉资源
//    * @callback2Delete
//    */
//   window.ppdf.DomManager.start = function (callback) {
//
//   };
//
//   /**
//    * 注入资源
//    * @url                 url标示，用于定位资源
//    * @resource            资源：blob、binaryarray或流式内容，可用于追加资源
//    */
//   window.ppdf.DomManager.inject = function (url, resource) {
//
//   }
// })();

(function (window, document) {
  var DOMManager = window.DOMManager = {};
  var urlCreator = window.URL || window.webkitURL;
  // 需要收集的节点类型
  var resourceTypes = ['img', 'audio', 'video', 'source', 'track'];
  // 默认收集的节点属性
  var defaultProp = 'ppdf-src';
  // 收集到的资源：[{url:url,absoluteUrl:absoluteUrl}]
  var resources = [];
  // 收集到的节点
  var nodes = [];
  // 节点上待收集的资源属性
  var resourceMap = {
    'img': [{definedProp: 'ppdf-src', prop: 'src'}],
    'video': [{definedProp: 'ppdf-src', prop: 'src'}, {definedProp: 'ppdf-poster', prop: 'poster'}],
    'audio': {definedProp: 'ppdf-src', prop: 'src'},
    'source': {definedProp: 'ppdf-src', prop: 'src'},// video or audio
    'track': {definedProp: 'ppdf-src', prop: 'src'},// video or audio
  };
  var AUDIO = 'AUDIO';
  var VIDEO = 'VIDEO';
  var generateAbsoluteUrl = getAbsoluteUrl();
  /**
   * 收集资源
   * @returns [{url:url,absoluteUrl:absoluteUrl}]
   */
  DOMManager.collectPageResource = function (callback) {
    var rawData = resourceTypes
      .map(function (type) {
        return collectNodeResource(type);
      })
      .reduce(function (a, b) {
        return a.concat(b);
      }, [])
      .filter(function (item) {
        return item.urls.length !== 0;
      });
    resources = generateFormattedResource(rawData);
    nodes = generateFormattedNodes(rawData);

    console.log('收集的资源：', resources);
    console.log('收集的节点：', nodes);

    typeof callback === 'function' && callback(resources);

    return resources;
  }

  /**
   * 恢复默认资源（分发资源加载失败的情况下调用）
   * @param url
   */
  DOMManager.onResourceLoadFailed = function (url) {
    nodes.forEach(function (item) {
      var node = item.node;
      var type = item.type;
      var props = Array.isArray(resourceMap[type]) ? resourceMap[type] : [resourceMap[type]];
      props.forEach(function (prop) {
        if (compareURL(node.getAttribute(prop['definedProp']), url)) {
          resetNodeResource(node, type, prop['prop'], node.getAttribute(prop['definedProp']));
        }
      })
    })
  }

  /**
   * 恢复所有资源为默认资源
   */
  DOMManager.resetAllResource = function () {
    nodes.forEach(function (item) {
      var node = item.node;
      var type = item.type;
      var props = Array.isArray(resourceMap[type]) ? resourceMap[type] : [resourceMap[type]];
      props.forEach(function (prop) {
        resetNodeResource(node, type, prop['prop'], node.getAttribute(prop['definedProp']));
      })
    })
  }

  /**
   * 替换节点资源为分发资源
   * @param url
   * @param blob
   */
  DOMManager.replacePageResource = function (url, blob) {
    var objectURL = urlCreator.createObjectURL(blob);
    nodes.forEach(function (item) {
      console.log('添加节点资源：', url, '=>', objectURL);
      setNodeResource(item.node, item.type, url, objectURL);
    })
  }

  /**
   * 获取收集到的 DOM 节点
   */
  DOMManager.collectPageNodes = function () {
    return nodes;
  }

  /**
   * 检测 DOM 变化
   * @param node
   * @param callback
   */
  DOMManager.observeDOM = function (node, callback) {
    var MutationObserver = window.MutationObserver || window.WebKitMutationObserver,
      eventListenerSupported = window.addEventListener;
    if (MutationObserver) {
      var obs = new MutationObserver(function (mutations) {
        if (mutations[0].addedNodes.length || mutations[0].removedNodes.length)
          callback();
      });
      obs.observe(node, {childList: true, subtree: true});
    } else if (eventListenerSupported) {
      node.addEventListener('DOMNodeInserted', callback, false);
      node.addEventListener('DOMNodeRemoved', callback, false);
    }
  };

  /**
   * 格式化收集到的资源
   * @param rawData
   * @returns {Array.<*>}
   */
  function generateFormattedResource(rawData) {
    return rawData
      .map(function (data) {
        return data.urls;
      })
      .reduce(function (a, b) {
        return a.concat(b);
      }, [])
      .map(function (url) {
        return {url: url, absoluteUrl: generateAbsoluteUrl(url)};
      }).filter(function (data, index, self) {
        // findIndex: IE not support, Chrome 45, Firefox 25, Safari 7.1
        return (self.findIndex(function (item) {
          return compareURL(item.url, data.url);
        }) === index && data.url );
      })
  }

  /**
   * 提取 DOM 节点
   * @param rawData
   * @returns {Array}
   */
  function generateFormattedNodes(rawData) {
    return rawData.map(function (data) {
      return {type: data.type, node: data.node};
    })
  }

  /**
   * 收集DOM节点的资源
   * @param type
   * @returns {Array}
   */
  function collectNodeResource(type) {
    return getNodes(type)
      .map(function (node) {
        return getURL(node, type);
      });
  }

  /**
   * 设置 DOM 节点的资源为分发资源
   * @param node
   * @param type
   * @param url
   * @param objectURL
   */
  function setNodeResource(node, type, url, objectURL) {
    var props = Array.isArray(resourceMap[type]) ? resourceMap[type] : [resourceMap[type]];
    props.forEach(function (prop) {
      if (isDOMNode(node) && node.hasAttribute(prop['definedProp']) && compareURL(node.getAttribute(prop['definedProp']), url)) {
        setAttribute(node, type, prop['prop'], objectURL);
      }
    })
  }

  /**
   * 恢复 DOM 节点资源为默认资源
   * @param node
   * @param type
   * @param prop
   * @param url
   */
  function resetNodeResource(node, type, prop, url) {
    console.log('恢复节点资源：', prop, '=>', url);
    setAttribute(node, type, prop, url);
  }

  /**
   * 设置节点资源
   * @param node
   * @param type
   * @param prop
   * @param url
   */

  function setAttribute(node, type, prop, url) {
    if (!isDOMNode(node))return;
    node[prop || 'src'] = url;
    // load video or audio
    if (type === 'audio' || type === 'video') {
      node.addEventListener('loadeddata', function () {
        isDataURL(url) && urlCreator.revokeObjectURL(url);
      })
      if (node.paused === false) {
        // 播放的资源保持播放状态
        node.pause();
        node.load();
        node.play();
      } else {
        node.load();
      }
      return;
    }
    if (type === 'source' || type === 'track') {
      var parentNode = node.parentNode;
      if (!parentNode)return;
      parentNode.addEventListener('loadeddata', function () {
        isDataURL(url) && urlCreator.revokeObjectURL(url);
      })
      if (parentNode.paused === false) {
        parentNode.pause();
        parentNode.load();
        parentNode.play();
      } else {
        parentNode && node.parentNode.load();
      }
      return;
    }
    node.addEventListener('load', function () {
      isDataURL(url) && urlCreator.revokeObjectURL(url);
    })
  }

  /**
   * 收集资源节点
   * @param type
   * @returns {Array.<T>|*}
   */
  function getNodes(type) {
    return Array.prototype.slice.call(document.getElementsByTagName(type))
      .filter(function (node) {
        var props = Array.isArray(resourceMap[type]) ? resourceMap[type] : [resourceMap[type]];
        var result = props.some(function (prop) {
          return node.hasAttribute(prop['definedProp'])
        })
        if (result === false)return false;
        if (type === 'source' || type === 'track') {
          return node.parentNode && (node.parentNode.nodeName === AUDIO || node.parentNode.nodeName === VIDEO);
        }
        return true;
      });
  }

  /**
   * 收集 DOM 节点的资源
   * @param node
   * @param type
   * @returns {{node: *, urls: Array, type: *}}
   */
  function getURL(node, type) {
    var props = Array.isArray(resourceMap[type]) ? resourceMap[type] : [resourceMap[type]];
    if (!isDOMNode(node)) {
      return {
        node: node,
        urls: [],
        type: type
      }
    }
    var urls = props.map(function (prop) {
      return node.getAttribute(prop['definedProp'] || defaultProp);
    })
    return {node: node, urls: urls, type: type};
  }

  /**
   * 比较 URL
   * @param a
   * @param b
   * @returns {boolean}
   */
  function compareURL(a, b) {
    return window.checkURIs(generateAbsoluteUrl(a), generateAbsoluteUrl(b));
  }


  /**
   * Detecting data URLs
   * @param url
   * @returns {boolean}
   */
  function isDataURL(url) {
    var regex = /^\s*data:([a-z]+\/[a-z]+(;[a-z\-]+\=[a-z\-]+)?)?(;base64)?,[a-z0-9\!\$\&\'\,\(\)\*\+\,\;\=\-\.\_\~\:\@\/\?\%\s]*\s*$/i;
    return !!url.match(regex);
  }

  /**
   * 判断一个对象是否为 DOM 节点（不严谨）
   * @param node
   * @returns {boolean}
   */
  function isDOMNode(node) {
    var result = !!node.nodeName;
    if (result === false) {
      console.log('不正确的 DOM 节点：', node);
    }
    return result;
  }

  /**
   * 根据已有 URL 生成一个绝对路径的 URL
   * @returns {Function}
   */
  function getAbsoluteUrl() {
    var a;
    return function (url) {
      if (!a) a = document.createElement('a');
      a.href = url;
      return a.href;
    };
  };

})(window, document)