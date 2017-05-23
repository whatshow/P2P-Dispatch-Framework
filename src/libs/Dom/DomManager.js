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
  var resourceMap = {
    'img': {definedProp: 'ppdf-src', prop: 'src'},
    'video': {definedProp: 'ppdf-src', prop: 'src'},
    'audio': {definedProp: 'ppdf-src', prop: 'src'},
    'source': {definedProp: 'ppdf-src', prop: 'src'},// video or audio
    'track': {definedProp: 'ppdf-src', prop: 'src'},// video or audio
  };
  var resourceNodes = [];
  /**
   * 收集资源
   * @returns [{url:url}]
   */
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
    console.trace(this);
    typeof callback === 'function' && callback(resources);
    return resources;
  }

  DOMManager.onResourceLoadFailed = function (url) {
    resourceNodes.forEach(function (item) {
      if (resourceMap[item.type]['definedProp'] === url) {
        item.node.setAttribute(resourceMap[item.type]['prop'], resourceMap[item.type]['definedProp'])
      }
    })
  }

  function collectNodeResource(type) {
    return getNodes(type)
      .map(function (node) {
        var isExist = resourceNodes.some(function (item) {
          return node.isEqualNode(item.node)
        });
        if (!isExist) {
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
        if (type === 'source' || type === 'track') {
          return node.parentNode && (node.parentNode.nodeName === 'AUDIO' || node.parentNode.nodeName === 'VIDEO');
        }
        return true;
      });
  }

  function getURL(node, type) {
    return node.nodeName ? node.getAttribute(resourceMap[type]['definedProp'] || 'ppdf-src') : '';
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
    console.log('Resource Collection', DOMManager.collectPageResource());
    console.log('Resource Nodes', resourceNodes);
  });

  /**
   * Demo
   * @type {Element}
   */
  var setButton = document.getElementById('set');
  var resetButton = document.getElementById('reset');

  setButton.addEventListener('click', function (e) {
    DOMManager.replacePageResource();
    var img = document.createElement("img");
    img.setAttribute('src', 'new.png');
    document.body.appendChild(img);
  })

  resetButton.addEventListener('click', function (e) {
    DOMManager.resetResource();
  })

})()