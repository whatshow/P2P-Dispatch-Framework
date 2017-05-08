//资源
window.ppdf.Resource = function(obj, url, attr, childNodes){
    if(!obj){
        return null;
    }
    if(!url){
        url = "";
    }
    if(!attr){
        attr = "src";
    }
    if(!childNodes){
        childNodes = [];
    }
    //保存属性
    this.obj = obj;                             //对象
    this.url = url;                             //链接
    this.attr = attr;                           //属性
    this.childNodes = childNodes;               //子节点
};
/***
 * 重新加载（只有audio、video元素需要重新加载）
 * @blob                                        二进制数据
 */
window.ppdf.Resource.load = function(blob){
    if(blob){

    }

    //重新加载
    try{
        this.obj.load();
    }catch(e){}
};