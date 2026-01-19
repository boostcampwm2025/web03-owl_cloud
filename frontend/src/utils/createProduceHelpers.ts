import { Transport } from 'mediasoup-client/types';

// track을 produce하는 헬퍼 함수들을 반환합니다.
export function createProduceHelper(sendTransport: Transport) {
  // 2) 실제 track produce 함수들
  const produceMic = (track: MediaStreamTrack) =>
    sendTransport.produce({
      track,
      appData: { type: 'mic' },
    });

  const produceCam = (track: MediaStreamTrack) =>
    sendTransport.produce({
      track,
      appData: { type: 'cam' },
    });

  const produceScreenVideo = (track: MediaStreamTrack) =>
    sendTransport.produce({
      track,
      appData: { type: 'screen_video' },
    });

  const produceScreenAudio = (track: MediaStreamTrack) =>
    sendTransport.produce({
      track,
      appData: { type: 'screen_audio' },
    });

  return {
    produceMic,
    produceCam,
    produceScreenVideo,
    produceScreenAudio,
  };
}
