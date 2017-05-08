/**
 * 返回对象
 * @code        返回码
 * @data        返回数据
 */
module.exports = function(code, data){
    return {
        code:   code,
        data:   data
    }
};


//返回码
//1001:         返回了需要丢弃的资源数组 data: [url, ..] url资源字符串
//1002:         返回了可以使用的客户端（排过序）和没有p2p资源的数组{reqs:[{url, clients:[client, ..]}, ..], notFindResources:  [url, ..]}
//100301:       告知客户端：存在这个资源提供者
//100302:       询问客户端：是否存在这个资源 data:{url:, address:} 资源路径&对方地址
//100304:       告知客户端：不存在这个资源提供者