module.exports = function(grunt){
    var prdFolder = "dist";

    //配置
    grunt.initConfig({
        pkg:            grunt.file.readJSON("package.json"),
        //删除文件
        clean: {
            build: {
                src:    prdFolder + "/built.js"
            }
        },
        concat:         {
            "js":{
                //注意顺序
                src:        [
                    'src/index.js',
                    'src/config.js',
                    //错误对象
                    'src/libs/Error/Error.js',
                    'src/libs/*.js',
                    //dom控制模块
                    'src/libs/Dom/*.js',

                    //p2p传输模块
                    'src/libs/P2P/P2P.js',
                    "src/libs/P2P/PeerClient.js",
                    'src/libs/P2P/Mission.js',
                    'src/libs/P2P/PeerClientPool.js',
                    //开始任务
                    'src/start.js'
                ],
                dest:   prdFolder + "/built.js"
            }
        },
        uglify:{
            options: {
                compress: {
                    drop_console: true
                }
            },
            "built.js":{
                src:    prdFolder + "/built.js",
                dest:   prdFolder + "/built.min.js"
            }
        },
        watch: {
            js: {
                files: ['src/**/*.js'],
                tasks:['default'],
                options: {livereload:false}
            }
        }
    });
    //开启合并模块
    grunt.loadNpmTasks("grunt-contrib-concat");
    //开启js压缩模块
    grunt.loadNpmTasks("grunt-contrib-uglify");
    //开启监视模块
    grunt.loadNpmTasks('grunt-contrib-watch');

    //执行任务
    grunt.registerTask('default', ["concat", "uglify"]);
    grunt.registerTask('watcher',['watch']);
};