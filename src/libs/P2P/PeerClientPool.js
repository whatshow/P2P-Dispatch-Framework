import {Signal} from '../Signal';
import {PeerClient} from './PeerClient';
import {Error} from '../Error/Error';

let NO_LIMIT_MISSIONQUEUE = -1;                 //不限制任务队列长度
//配置
let setting = {
    peerClientLive:           20000,             //一个客户端默认生成10000ms
    maxPeerClients:           10,                //客户度最大数量

    //最大任务数量
    maxMissions:              NO_LIMIT_MISSIONQUEUE

};
//任务队列
let missionQueue = [];
//P2P客户端池，形如 [peerclient,  ...]
let pool = [];

export class PeerClientPool{
    /**
     * 初始化（只有信令服务器开启时才能打开）
     */
    static init = () =>{
      //增加控制器
      Signal.addController((res) => {
          console.log(res);
          switch(parseInt(res.code)){
              //收到提供描述信息
              case 1003:
                  this.onOfferDesc(res.data);
                  break;
              //收到响应描述
              case 1004:
                  this.onAnswerDesc(res.data);
                  break;
              //收到候选信息
              case 1005:
                  this.onCandidate(res.data);
                  break;
              //接收到发送数据请求，准备发送数据
              case 1201:
                  this.onDataRequest(res.data);
                  break;
              //接收到拒绝服务，准备使用下一个提供者
              case 1202:
                  this.onRefuseProvide(res.data);
                  break;
              //接收到终止请求，释放用于发送数据的客户端
              case 1203:
                  this.onRefuseRequest(res.data);
                  break;
          }
      });
    };

    /**
     * 增加一个任务
     * @mission           任务
     */
    static addMission(mission){
        //先寻找空闲客户端
        let client = this.findUsefulClient();
        //如果没有空闲的，则尝试构造
        if(!client){
            client = this.addClient();
        }
        //如果构造失败，则说明任务并发达到最高，则把任务添加到队列
        if(!client){
            console.log("把任务添加到队列");
            if(setting.maxMissions === NO_LIMIT_MISSIONQUEUE){
                //不限制队列长度，直接添加
                missionQueue.push(mission);
                return true;
            }else if(missionQueue.length >= setting.maxMissions){
                //队列长度满了，丢弃任务
                //触发任务失败回调
                mission.fail();
                return false;
            }else{
                //任务队列不满，则将任务放到任务队列中
                missionQueue.push(mission);
                return true;
            }
        }
        //执行到此说明客户端构造成功，则把任务绑定到客户端中
        console.log("执行任务");
        console.log(mission);
        console.warn("线程池情况");
        console.log(pool);
        this.doMission(client, mission);
        return true;
    };

    /*** 接收到消息的回调 ***/
    /**
     * 开启传输（客户端是新建出来，不用中止释放）
     * @data            websocket返回对象中的data字段
     */
    static async onDataRequest(data){
        console.warn("*** 开启传输***");
        //先寻找空闲客户端
        let client = this.findUsefulClient();
        //如果没有空闲的，则尝试构造
        if(!client){
            client = this.addClient();
        }
        console.log("客户端");
        console.log(client);
        console.log("线程池");
        console.log(pool);

        //如果构造失败，则说明任务并发达到最高，则拒绝本次传输
        if(!client){
            console.log("拒绝提供数据传输服务（本地线程并发达到最高，再并发影响效率）");
            //通知失败
            data.offer.isAvailable = false;
            Signal.send(JSON.stringify({
                code:             3202,
                data:             data
            }));
            return;
        }

        //执行到此说明，可用获取到一个可用的客户端
        console.log("得到了一个可用的客户端");
        console.log(client);
        //绑定对方地址
        client.bindTargetAddress(data.answer.address);
        //绑定对方时间戳
        client.targetTimestamp = data.answer.timestamp;
        //准备描述
        try{
            await client.prepareOffer(data.url);
            let desc = await client.createOffer();
            console.log("获得了描述对象");
            console.log(desc);
            //配置描述 & 时间戳
            data.offer.desc = desc;
            data.offer.timestamp = client.getTimestamp();
            console.log("配置发送数据");
            console.log(data);
            //发送提供描述
            let msg = {
                code:             3003,
                data:             data
            };
            Signal.send(JSON.stringify(msg));
            console.log("通知提供描述 " + JSON.stringify(msg));
        }catch(e){
            console.log(new Error(40023, "未知原因拒绝提供数据", e));
            //通知拒绝服务
            data.offer.isAvailable = false;
            Signal.send(JSON.stringify({
                code:             3202,
                data:             data
            }));
        }
    };
    /**
     * 收到拒绝服务（执行速度快，不用释放）
     * @data                websocket返回对象中的data字段
     */
    static onRefuseProvide(data){
        //找到这个客户端（优先采用时间戳，如果没有时间戳，则采用描述信息）
        let client = data.answer.timestamp ? this.findPeerClientByTimestamp(data.answer.timestamp) : this.findPeerClientByDesc(data.answer.desc);

        //如果没有找到这个客户端，说明客户端已经释放了，则忽略这个消息且执行下个任务
        if(!client){
            //寻找可用的客户端
            client = this.findUsefulClient();
            //如果没有空闲的，则尝试新增
            if(!client){
                client = this.addClient();
            }
            //如果还是获取不到客户端，则本次转台结束
            if(!client){
                //结束
                return;
            }
            //执行到此说明找到了一个可用的客户端，则尝试执行下个任务
            let mission = missionQueue.shift();
            if(mission){
                this.doMission(client, mission);
                //结束
                return;
            }
        }

        //执行到此说明这个连接还没有释放，重新执行本次任务
        this.doMission(client);
    };
    /**
     * 收到终止数据请求
     * @data          websocket返回对象中的data字段
     */
    static onRefuseRequest(data){
        //找到匹配offer的client（优先采用时间戳匹配，如果找不到则采用描述信息）
        let client = data.offer.timestamp ? this.findPeerClientByTimestamp(data.offer.timestamp) : this.findPeerClientByDesc(data.offer.desc);
        //如果没有找到，说明客户端已经被释放掉了,直接结束
        if(!client){
            return;
        }
        //执行到此说明找到了，则立刻释放本地客户端
        client.releaseImmediately();
    };
    /**
     * 收到提供描述
     * @data          websocket返回对象中的data字段
     */
    static async onOfferDesc(data){
        console.log("收到提供描述");
        console.log(data);

        //寻找到本地的客户端
        let client = this.findPeerClientByTimestamp(data.answer.timestamp);
        //如果没有找到客户端，说明这个连接已经被释放了，不再处理
        if(!client){
            console.log("没有找到客户端，说明这个连接已经被释放了，不再处理");
            return;
        }

        //执行到此说明一切正常，则开始响应
        console.log("执行到此说明一切正常，则开始响应");
        //中断释放过程：如果中断失败，则说明客户端已经释放过了，已经触发了任务失败
        if(client.cutRelease()){
            //绑定时间戳
            client.targetTimestamp = data.offer.timestamp;
            //准备响应数据通道
            client.prepareAnswer();
            //构造响应描述
            try{
                //响应描述成功
                data.answer.desc = await client.answerDesc(data.offer.desc);

                let msg = {
                    code:       3004,
                    data:       data
                };
                Signal.send(JSON.stringify(msg));
                console.log("发送响应描述 " + JSON.stringify(msg));
                client.setRelease();                                  //重新开始等待释放
            }catch(e){
                //创建描述失败
                //发出终止数据请求
                data.answer.isAvailable = false;
                let msg = {
                    code:       3203,
                    data:       data
                };
                Signal.send(JSON.stringify(msg));
                console.log("创建answerDesc失败" + JSON.stringify(msg));
                console.log(e);
                //尝试下一个数据提供者
                this.doMission(client);
                client.setRelease();                                  //重新开始等待释放
            }
        }
    };
    /**
     * 收到响应描述
     * @data          websocket返回对象中的data字段
     */
    static onAnswerDesc(data){
        //找到这个客户端
        let client = this.findPeerClientByTimestamp(data.offer.timestamp);
        //如果找不到这个客户度端，则说明已经过期了，通知对方拒绝服务
        if(!client){
            data.offer.isAvailable = false;
            Signal.send(JSON.stringify({
                code:             3202,
                data:             data
            }));
            return;
        }

        //执行到此说明找到了客户端
        client.storeAnswerDesc(data.answer.desc);
    };
    /**
     * 收到候选信息
     * @data          websocket
     */
    static onCandidate(data){
        console.warn("收到候选信息");
        console.log(data);
        console.warn("客户端池子情况");
        console.dir(pool);
        let client;
        //提供者发来的候选信息
        if(data.offer.candidate){
            client = this.findPeerClientByTimestamp(data.answer.timestamp);
            console.log(client);
            //如果找不到客户端，中止数据请求
            if(!client){
                data.answer.isAvailable = false;
                Signal.send(JSON.stringify({
                    code:       3203,
                    data:       data
                }));
                return;
            }
            //指定到此说明找到了客户端，保存数据
            console.log("提供者发来的候选信息（已保存）");
            client.setCandidate(data.offer.candidate);
        }

        //响应者发来的候选信息
        if(data.answer.candidate){
            client = this.findPeerClientByTimestamp(data.offer.timestamp);
            console.log(client);
            //如果找不到客户端，拒绝数据提供
            if(!client){
                data.offer.isAvailable = false;
                Signal.send(JSON.stringify({
                    code:             3202,
                    data:             data
                }));
                return;
            }
            //指定到此说明找到了客户端，保存数据
            console.log("响应者发来的候选信息（已保存）");
            client.setCandidate(data.answer.candidate);
        }
    };



    /*** 被调用的方法 ***/
    /**
     * 执行任务（尝试建立连接，连接建立成功，则开始执行传输）
     * @client                客户端
     * @mission               任务（不传递表示再次执行任务）
     */
    static doMission = (client, mission) =>{
        //检查传递的参数
        if(!mission){
            //如果没有设置任务，则采用client自己的任务
            mission = client.getMission();
        }else{
            //有任务则设置任务
            client.setMission(mission);
        }
        //如果依旧没有任务，则说明本身就没有任务，直接结束
        if(!mission){
            return;
        }

        //执行到此说明一切准备就绪，开始发送数据索取请求
        //中断释放过程：如果中断失败，则说明客户端已经释放过了，已经触发了任务失败
        if(client.cutRelease()){
            //执行到此说明中断成功，则返回结果
            let address = mission.getNextProviderAddress();
            //如果没有地址，则结束
            if(!address){
                client.releaseImmediately();
                return;
            }

            let msg = {
                code:   3201,
                data:   {
                    url:          mission.url,
                    offer:  {
                        //IP地址
                        address:    address
                    },
                    answer: {
                        //时间戳
                        timestamp:  client.getTimestamp()
                    }
                }
            };
            Signal.send(JSON.stringify(msg));
            console.log('发送数据索取请求 ' + JSON.stringify(msg));
            //绑定地址
            client.bindTargetAddress(address);
            //开始客户端对象释放计算时间
            client.setRelease();
        }
    };
    /**
     * 根据对象寻找客户端
     * @obj
     */
    static findPeerClientByObj = (obj) => {
        for(let i = 0; i < pool.length; i++){
            if(pool[i].obj === obj && !pool[i].isEmpty()){
                return pool[i];
            }else if(i === pool.length - 1){
                return null;
            }
        }
    };
    /**
     * 根据时间戳寻找客户端
     * @timestamp             时间戳
     */
    static findPeerClientByTimestamp = (timestamp) => {
        for(let i = 0; i < pool.length; i++){
            if(pool[i].hasTimestamp(timestamp) && !pool[i].isEmpty()){
                return pool[i];
            }else if(i === pool.length - 1){
                return null;
            }
        }
    };
    /**
     * 根据desc寻找PeerClient
     * @desc                  描述信息
     */
    static findPeerClientByDesc(desc){
        for(let i = 0; i < pool.length; i++){
            if(pool[i].hasLocalDesc(desc) && !pool[i].isEmpty()){
                return pool[i];
            }else if(i === pool.length - 1){
                return null;
            }
        }
    };
    /**
     * 新增一个客户度
     */
    static addClient(){
        //增加客户端数量不能超出池容量
        if(pool.length < setting.maxPeerClients){
            let client = new PeerClient();
            //经过一定时间释放客户端
            client.setRelease(setting.peerClientLive);
            //增加
            pool.push(client);
            //成功
            return client;
        }else{
            return null;
        }
    };
    /**
     * 寻找可用客户端
     */
    static findUsefulClient(){
        if(pool.length === 0){
            return null;
        }

        //如果有可用的客户端，则返回一个新的
        for(let i = 0; i < pool.length; i ++){
            if(pool[i].isEmpty()){
                //找到了空闲的客户度，则重新激活，并返回这个客户端给
                pool[i].rebuild();
                return pool[i];
            }else if(i === pool.length - 1){
                //什么都没有找到，返回null
                return null;
            }
        }
    };
}