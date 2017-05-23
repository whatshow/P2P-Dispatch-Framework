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

(function () {
  var DOMManager = window.DOMManager = {};
  var resourceTypes = ['img', 'audio', 'video', 'source', 'track'];
  var defaultProp = 'ppdf-src';
  var resourceMap = {
    'img': {definedProp: 'ppdf-src', prop: 'src'},
    'video': {definedProp: 'ppdf-src', prop: 'src'},
    'audio': {definedProp: 'ppdf-src', prop: 'src'},
    'source': {definedProp: 'ppdf-src', prop: 'src'},// video or audio
    'track': {definedProp: 'ppdf-src', prop: 'src'},// video or audio
  };
  var resourceNodes = [];
  var AUDIO = 'AUDIO';
  var VIDEO = 'VIDEO';
  var SOURCE = 'SOURCE';
  var TRACK = 'TRACK';
  /**
   * 收集资源
   * @returns [{url:url}]
   */
  //TODO: url格式化，规范，如何比较？
  //TODO: audio vedio 资源加载研究
  //TODO: 视频音频浏览器支持情况检测
  //TODO: 内存释放研究
  DOMManager.collectPageResource = function (callback) {
    var resources = resourceTypes
      .map(function (type) {
        return collectNodeResource(type);
      })
      .filter(function (resource) {
        return resource.length;
      })
      .reduce(function (a, b) {
        return a.concat(b);
      }, [])
      .map(function (url) {
        return {url: url};
      });
    console.log('收集的资源：', resources);
    console.log('资源节点：', resourceNodes);
    typeof callback === 'function' && callback(resources);
    return resources;
  }

  DOMManager.onResourceLoadFailed = function (url) {
    resourceNodes.forEach(function (item) {
      var node = item.node;
      var definedProp = resourceMap[item.type]['definedProp'];
      if (node.getAttribute(definedProp) === url) {
        console.log('恢复节点资源：', resourceMap[item.type]['prop'], '=>', node.getAttribute(definedProp));
        node.setAttribute(resourceMap[item.type]['prop'], node.getAttribute(definedProp));
      }
    })
  }

  DOMManager.addNodeResource = function (url, blob) {
    var objectURL = window.URL && window.URL.createObjectURL(blob);
    resourceNodes.forEach(function (item) {
      console.log('添加节点资源：', url, '=>', objectURL);
      setNodeResource(item.node, item.type, url, objectURL);
    })
  }

  function collectNodeResource(type) {
    return getNodes(type)
      .map(function (node) {
        if (!checkNodeIsInList(node)) {
          resourceNodes.push({node: node, type: type});
        }
        return getURL(node, type);
      })
      .filter(function (url) {
        return url;
      });
  }

  function getNodes(type) {
    return Array.prototype.slice.call(document.getElementsByTagName(type))
      .filter(function (node) {
        if (!node.hasAttribute(resourceMap[type]['definedProp']))return false;
        if (type === 'source' || type === 'track') {
          return node.parentNode && (node.parentNode.nodeName === AUDIO || node.parentNode.nodeName === VIDEO);
        }
        return true;
      });
  }

  function getURL(node, type) {
    return isDOMNode(node) ? node.getAttribute(resourceMap[type]['definedProp'] || defaultProp) : '';
  }

  function checkNodeIsInList(node) {
    return resourceNodes.some(function (item) {
      return isDOMNode(node) && node.isEqualNode(item.node)
    });
  }

  function isDOMNode(node) {
    return !!node.nodeName;
  }

  function setNodeResource(node, type, url, objectURL) {
    var prop = resourceMap[type]['prop'];
    var definedProp = resourceMap[type]['definedProp'];
    if (isDOMNode(node) && node.hasAttribute(definedProp) && node.getAttribute(definedProp) === url) {
      node.setAttribute(prop, objectURL);
      if (type === AUDIO || type === VIDEO) {
        node.load();
      }
      if (type === SOURCE || type === TRACK) {
        node.parentNode && node.parentNode.load();
      }
      node.onload = function () {
        window.URL && window.URL.revokeObjectURL(objectURL);
      }
    }

  }

  function observeDOM(obj, callback) {
    var MutationObserver = window.MutationObserver || window.WebKitMutationObserver,
      eventListenerSupported = window.addEventListener;
    if (MutationObserver) {
      // define a new observer
      var obs = new MutationObserver(function (mutations, observer) {
        if (mutations[0].addedNodes.length || mutations[0].removedNodes.length)
          callback();
      });
      // have the observer observe foo for changes in children
      obs.observe(obj, {childList: true, subtree: true});
    } else if (eventListenerSupported) {
      obj.addEventListener('DOMNodeInserted', callback, false);
      obj.addEventListener('DOMNodeRemoved', callback, false);
    }
  };

  // Observe a specific DOM element:
  observeDOM(document.getElementsByTagName('html')[0], function () {
    DOMManager.collectPageResource();
  });

  /**
   * Demo
   * @type {Element}
   */
  var setButton = document.getElementById('set');
  var resetButton = document.getElementById('reset');
  var testURL = './img.png';
  setButton.addEventListener('click', function (e) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', testURL, true);
    xhr.responseType = 'blob';
    xhr.onload = function (e) {
      if (this.status === 200) {
        var myBlob = this.response;
        DOMManager.addNodeResource(testURL, myBlob);
      }
    };
    xhr.send();
  })

  resetButton.addEventListener('click', function (e) {
    DOMManager.onResourceLoadFailed(testURL);
  })

})()