import { type WorkerSettings } from "mediasoup/types";


export const mediaSoupWorkerConfig : WorkerSettings = {
  // log에 남길 레벨을 정한다. ( warn )
  logLevel : process.env.NODE_ENV === "production" ? "warn" : "debug",

  logTags : process.env.NODE_ENV === "production" ? 
  [
    "info", "ice", "dtls", "rtp"
  ] 
  : 
  [
    "info", 
    "ice", // ice 후보 찾기 등 할때 로깅을 남기려고 한다.
    "dtls", // dtls 핸드세이킹 할때 로깅 남기기 
    "srtp", // rtp 패킷을 암호화해서 보내는 부분 로깅 
    "rtp", // rtp 전송할때 로깅을 남김
    "rtcp" // rtp를 제어하는 프로토콜인데 이 부분에서 로깅을 남긴다.
  ],

  // udp 사용 포트
  rtcMinPort: 40000, 
  rtcMaxPort: 49999,

  // 현재나의 로그 메타데이터를 추가하려면 
  appData : {
    env : process.env.NODE_ENV
    // 나중에 ip를 추가해서 어느 ip에 worker인지도 확인이 가능하고 탐색할때 유용하다. 
  }
  
};