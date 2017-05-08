/* 阿里STS客户端调用凭证 */
/**
 * 可以扮演sts的账号
 */
module.exports.accessKeyId = "ruclDiaRPg00Vy7z";
module.exports.AccessKeySecret = "R0ibkbvVN6djX4LapjouXTTEAazIeo";
/**
 * 角色
 */
module.exports.ArnRole = "acs:ram::1728413479074541:role/app-rw-role";
/**
 * token过期时间（单位：秒）
 */
module.exports.tokenExpireTime = 900;


/**
 * 规则
 */
module.exports.policy = {
    //完全授权
    FullAuthority: {
        "Statement": [
            {
                "Action": [
                    "oss:*"
                ],
                "Effect": "Allow",
                "Resource": ["acs:oss:*:*:*"]
            }
        ],
        "Version": "1"
    },
    //只读不写
    OnlyRead: {
        "Statement": [
            {
                "Action": [
                    "oss:GetObject",
                    "oss:ListObjects"
                ],
                "Effect": "Allow",
                "Resource": ["acs:oss:*:*:app-base-oss/*", "acs:oss:*:*:app-base-oss"]
            }
        ],
        "Version": "1"
    },
    //只写不读——不限制前缀
    OnlyWriteUnlimitedPrefix: {
        "Statement": [
            {
                "Action": [
                    "oss:PutObject"
                ],
                "Effect": "Allow",
                "Resource": ["acs:oss:*:*:app-base-oss/*", "acs:oss:*:*:app-base-oss"]
            }
        ],
        "Version": "1"
    },
    //只写不读——限制前缀
    OnlyWriteLimitedPrefix: {
        "Statement": [
            {
                "Action": [
                    "oss:PutObject"
                ],
                "Effect": "Allow",
                "Resource": ["acs:oss:*:*:app-base-oss/user1/*", "acs:oss:*:*:app-base-oss"]
            }
        ],
        "Version": "1"
    },
    //读写——不限制前缀
    ReadAndWriteUnlimitedPrefix: {
        "Statement": [
            {
                "Action": [
                    "oss:GetObject",
                    "oss:PutObject",
                    "oss:DeleteObject",
                    "oss:ListParts",
                    "oss:AbortMultipartUpload",
                    "oss:ListObjects"
                ],
                "Effect": "Allow",
                "Resource": ["acs:oss:*:*:app-base-oss/*", "acs:oss:*:*:app-base-oss"]
            }
        ],
        "Version": "1"
    },
    //读写——限制前缀
    ReadAndWriteLimitedPrefix: {
        "Statement": [
            {
                "Action": [
                    "oss:GetObject",
                    "oss:PutObject",
                    "oss:DeleteObject",
                    "oss:ListParts",
                    "oss:AbortMultipartUpload",
                    "oss:ListObjects"
                ],
                "Effect": "Allow",
                "Resource": ["acs:oss:*:*:app-base-oss/user1/*", "acs:oss:*:*:app-base-oss"]
            }
        ],
        "Version": "1"
    }
};