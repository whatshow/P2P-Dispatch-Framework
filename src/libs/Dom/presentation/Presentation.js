(function () {
  /**
   * Presentation
   * @type {Element}
   */
  var setButton = document.getElementById('set');
  var resetButton = document.getElementById('reset');
  var removeButton = document.getElementById('remove');
  var restoreButton = document.getElementById('restore')


  var testURL = ['./img.png', './video.mp4', './audio.mp3'];

  DOMManager.observeDOM(document.getElementsByTagName('html')[0], function () {
    DOMManager.collectPageResource();
  });

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
    alert('测试移除 DOM 节点是否触发资源重新收集')
  })

  restoreButton.addEventListener('click', function () {
    document.getElementsByClassName('block')[0].innerHTML = originDOMString;
  })

  Element.prototype.remove = function () {
    this.parentElement.removeChild(this);
  }

  /**
   * 构造 Blob 对象，演示使用
   * @param url
   */
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

  var originDOMString = `<p>IMG</p>
    <img width="100px" ppdf-src="img.png" alt="SRC 为空"/>

    <p>VIDEO</p>
    <video controls width="100px" ppdf-src="./video.mp4" ppdf-poster="img.png">
        你的浏览器不支持 <code>video</code>
    </video>

    <p>AUDIO</p>
    <audio controls width="100px" ppdf-src="./audio.mp3">
        你的浏览器不支持 <code>audio</code>
    </audio>

    <p>VIDEO SOURCE</p>
    <video controls width="100px" poster="img.png">
        你的浏览器不支持 <code>video</code>
        <source ppdf-src="./video.mp4" type="video/mp4">
    </video>

    <p>AUDIO SOURCE</p>
    <audio controls width="100px">
        你的浏览器不支持 <code>audio</code>
        <source ppdf-src="./audio.mp3" type="audio/mp3">
    </audio>`;
})()