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
  var urlCreator = window.URL || window.webkitURL;
  var resourceTypes = ['img', 'audio', 'video', 'source', 'track', 'poster'];
  var defaultProp = 'ppdf-src';
  var resources = [];
  var nodes = [];
  var resourceMap = {
    'img': [{definedProp: 'ppdf-src', prop: 'src'}],
    'video': [{definedProp: 'ppdf-src', prop: 'src'}, {definedProp: 'ppdf-poster', prop: 'poster'}],
    'audio': {definedProp: 'ppdf-src', prop: 'src'},
    'source': {definedProp: 'ppdf-src', prop: 'src'},// video or audio
    'track': {definedProp: 'ppdf-src', prop: 'src'},// video or audio
  };
  var AUDIO = 'AUDIO';
  var VIDEO = 'VIDEO';
  var SOURCE = 'SOURCE';
  var TRACK = 'TRACK';
  var generateAbsoluteUrl = getAbsoluteUrl();
  /**
   * 收集资源
   * @returns [{url:url,absoluteUrl:absoluteUrl}]
   */
  //TODO: url格式化，规范，如何比较？
  //TODO: audio vedio 资源加载研究
  //TODO: 视频音频浏览器支持情况检测
  //TODO: 内存释放研究
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

  DOMManager.onResourceLoadFailed = function (url) {
    nodes.forEach(function (item) {
      var node = item.node;
      var type = item.type;
      var props = Array.isArray(resourceMap[type]) ? resourceMap[type] : [resourceMap[type]];
      props.forEach(function (prop) {
        if (compareURL(node.getAttribute(prop['definedProp']), url)) {
          resetNodeResource(node, prop['prop'], node.getAttribute(prop['definedProp']));
        }
      })
    })
  }

  DOMManager.replacePageResource = function (url, blob) {
    var objectURL = urlCreator.createObjectURL(blob);
    nodes.forEach(function (item) {
      console.log('添加节点资源：', url, '=>', objectURL);
      setNodeResource(item.node, item.type, url, objectURL);
    })
  }

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
        return self.findIndex(function (item) {
            return compareURL(item.url, data.url);
          }) === index;
      })
  }

  function generateFormattedNodes(rawData) {
    return rawData.map(function (data) {
      return {type: data.type, node: data.node};
    })
  }

  function collectNodeResource(type) {
    return getNodes(type)
      .map(function (node) {
        return getURL(node, type);
      });
  }

  function setNodeResource(node, type, url, objectURL) {
    var props = Array.isArray(resourceMap[type]) ? resourceMap[type] : [resourceMap[type]];
    props.forEach(function (prop) {
      if (isDOMNode(node) && node.hasAttribute(prop['definedProp']) && compareURL(node.getAttribute(prop['definedProp']), url)) {
        node.setAttribute(prop['prop'], objectURL);
        if (type === AUDIO || type === VIDEO) {
          node.load();
        }
        if (type === SOURCE || type === TRACK) {
          node.parentNode && node.parentNode.load();
        }
        node.onload = function () {
          urlCreator.revokeObjectURL(objectURL);
        }
      }
    })

  }

  function resetNodeResource(node, prop, url) {
    console.log('恢复节点资源：', prop, '=>', url);
    isDOMNode(node) && node.setAttribute(prop, url);
  }

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

  function compareURL(a, b) {
    return generateAbsoluteUrl(a).toLowerCase() === generateAbsoluteUrl(b).toLowerCase();
  }

  function isDOMNode(node) {
    return !!node.nodeName;
  }

  function getAbsoluteUrl() {
    var a;
    return function (url) {
      if (!a) a = document.createElement('a');
      a.href = url;
      return a.href;
    };
  };

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
  var removeButton = document.getElementById('remove');

  var testURL = ['./img.png', './video.mp4', './audio.mp3'];

  setButton.addEventListener('click', function (e) {
    testURL.forEach(function (url) {
      loadBlobResource(url);
    })
  })

  resetButton.addEventListener('click', function (e) {
    testURL.forEach(function (url) {
      DOMManager.onResourceLoadFailed(url);
    })
  })

  removeButton.addEventListener('click', function (e) {
    nodes[0] && nodes[0].node.remove();
  })

  Element.prototype.remove = function () {
    this.parentElement.removeChild(this);
  }

  function loadBlobResource(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'blob';
    xhr.onload = function (e) {
      if (this.status === 200) {
        var myBlob = this.response;
        DOMManager.replacePageResource(url, myBlob);
      }
    };
    xhr.send();
  }

})()