import { RtpParameters } from 'mediasoup/types';

export type CreatePropduceDto = {
  transport_id: string;
  room_id: string;
  socket_id: string;
  user_id: string;
  kind: 'audio' | 'video';
  type: 'mic' | 'cam' | 'screen_video' | 'screen_audio';
  rtpParameters: RtpParameters;
};

export type GetProducerProps = {
  producer_id: string;
  type: 'mic' | 'cam';
  kind: 'audio' | 'video';
  status: 'on' | 'off';
};

// 반환해야 하는 데이터
export type CreateProduceResult = {
  producer_id: string;
  user_id: string;
  status: 'user' | 'main';
  kind: 'audio' | 'video'; // 개인에 produce이면 user이고 만약 전체적인 producing이면 main
  type: 'mic' | 'cam' | 'screen_video' | 'screen_audio';
  is_restart: boolean;
};

// 데이터를 저장할때 사용된 요소
export type InsertProducerDto = {
  room_id: string;
  user_id: string;
  producer_id: string;
  type: 'mic' | 'cam' | 'screen_video' | 'screen_audio';
  kind: 'audio' | 'video';
};
