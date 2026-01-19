import { MediaKind, RtpCapabilities, RtpParameters } from 'mediasoup/types';

export type CreateConsumerDto = {
  transport_id: string;
  room_id: string;
  socket_id: string;
  user_id: string;
  status: 'user' | 'main';
  producer_id: string;
  rtpCapabilities: RtpCapabilities;
};

export type InsertConsumerDataDto = {
  transport_id: string;
  room_id: string;
  consumer_id: string;
  producer_id: string;
  user_id: string;
  status: 'user' | 'main';
};

export type CreateConsumerResult = {
  producer_id: string;
  consumer_id: string;
  kind: MediaKind;
  rtpParameters: RtpParameters;
};
