import {
  RouterOptions,
  RtpCodecCapability,
  type TransportListenIp,
  type WorkerSettings,
} from 'mediasoup/types';

// worker에 쓰이는 config
export const mediaSoupWorkerConfig: WorkerSettings = {
  // log에 남길 레벨을 정한다. ( warn )
  logLevel: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',

  logTags:
    process.env.NODE_ENV === 'production'
      ? ['info']
      : [
          'info',
          'ice', // ice 후보 찾기 등 할때 로깅을 남기려고 한다.
          'dtls', // dtls 핸드세이킹 할때 로깅 남기기
          'srtp', // rtp 패킷을 암호화해서 보내는 부분 로깅
          'rtp', // rtp 전송할때 로깅을 남김
          'rtcp', // rtp를 제어하는 프로토콜인데 이 부분에서 로깅을 남긴다.
        ],

  // udp 사용 포트
  rtcMinPort: 40000,
  rtcMaxPort: process.env.NODE_ENV === 'production' ? 41999 : 40299,

  // 현재나의 로그 메타데이터를 추가하려면
  appData: {
    env: process.env.NODE_ENV,
    // 나중에 ip를 추가해서 어느 ip에 worker인지도 확인이 가능하고 탐색할때 유용하다.
  },
};

// router에 쓰이는 config ( router가 허용하는 config )
export const mediaSoupRouterConfig: RouterOptions = {
  mediaCodecs: <Array<RtpCodecCapability>>[
    // audio 설정
    {
      kind: 'audio',
      mimeType: 'audio/opus', // 음성에서 기본적으로 사용하는 코덱이다.
      clockRate: 48000,
      // stereo 타입으로 화면공유에서 사용되는 사운드, 음악도 허용 한다는 의미
      channels: 2,
    },

    // video 설정
    {
      kind: 'video',
      mimeType: 'video/VP8',
      clockRate: 90000,
      // 비트레이트를 안정적으로 관리하기 위해서 사용하는요소 - simulcast에서 제어할때 사용할 것이다.
      rtcpFeedback: [
        // 패킷 재전송 요청에 사용됨
        { type: 'nack' },
        // 특정 키프레임을 요청하며 화질 복구에 사용됨
        { type: 'nack', parameter: 'pli' },
        // 전체 키프레임 요청
        { type: 'ccm', parameter: 'fir' },
        // 수신자가 감당 가능한 최대 비트레이트 알려줄때 사용 ( chrome 계열에서 사용 )
        { type: 'goog-remb' },
        // 현재 패킷 전송에서 네트워크 상태를 계산할때 사용
        { type: 'transport-cc' },
      ],
      parameters: {
        'x-google-start-bitrate': 600, // 첫 시작에서 쓰일 bite_rate ( 화면 공유에서는 600이 적당 )
      },
    },

    // 화면 공유용 vp9 사용
    {
      kind: 'video',
      // 같은 화질 대비 VP8보다 효율이 좋다.텍스트, 슬라이드와 같은 정적인 화면에서 좋다. 하지만 인코딩 CPU 부담이 큰편이다.
      mimeType: 'video/VP9',
      clockRate: 90000,
      //  프레임은
      rtcpFeedback: [
        // nack 수신자가 이 RTP 패킷 번호가 누락 되었음을 알려준다.
        { type: 'nack' },
        // 프레임 복구를 할때 전체 프레임즉 i-frameㅡㅇㄹ 다시 보내달라는 것이다.
        { type: 'nack', parameter: 'pli' },
        // 패킷 도착 시간을 전송해서 비트레이트, 프레임 드랍, 레이어 변경을 실시한다.
        { type: 'transport-cc' },
      ],
      // 가장 기본적인 호환이 되는 걸로 변경
      parameters: { 'profile-id': 0 },
    },
  ],
};

// listenIps에 대해서
export const listenIps: Array<TransportListenIp> = [
  {
    ip: '0.0.0.0', // 허용하는 프론트엔드 ip,
    announcedIp: process.env.NODE_APP_SFU_PUBLIC_IP ?? '127.0.0.1', // ice 검증에서 나의 ip를 소개 클라이언트는 이 ip로 접근한다. 즉 udp로 접근이 가능한 ip를 알려주어야 한다.
  },
];
