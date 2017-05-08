module.exports = function(res, code, access_token, msg, url,data) {
    //构造返回对象
    var response = {
        access_token: access_token || "",
        msg: msg || "",
        url: url || "",
        data: data || ""
    };
    //设置状态码
    res.status(code);
    //显示json格式信息
    return res.json(response);
};