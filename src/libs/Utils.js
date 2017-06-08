import Promise from '../../modules/es6-promise/es6-promise.auto.min';
import SparkMD5 from '../../modules/spark-md5/spark-md5.min';

//工具集合
export class Utils{
    static file = File;
}


/*** 文件操作 ***/
class File{
    /**
     * 检测是否支持文件操作
     */
    static isSupported = () => {
        return window.Blob && window.FileReader;
    };
    /**
     * blob转二进制
     * @blob                二进制数据
     */
    static blob2binary = (blob) => {
        return new Promise((resolve, reject) => {
            let fileReader = new FileReader();
            fileReader.readAsArrayBuffer(blob);
            fileReader.onload = (e) => {
                resolve(fileReader.result);
            }
        });
    };
    /**
     * 计算二进制的md5
     * @binary
     */
    static md5 = (binary) => {
        let spark = new SparkMD5.ArrayBuffer();
        spark.append(binary);
        return spark.end();
    }
}