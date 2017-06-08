import {PeerClientPool} from './PeerClientPool';

export class P2P{
    //线程池
    static PeerClientPool = PeerClientPool;


    /**
     * 检查是否支持p2p
     */
    static check(){
        return window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
    };
}