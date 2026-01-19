import { MediaKind, RtpCapabilities, RtpParameters } from 'mediasoup/types';

export type CreateConsumersProducerInfoDto = {
  status: 'user' | 'main';
  producer_id: string;
  rtpCapabilities: RtpCapabilities;
};

export type CreateConsumersDto = {
  transport_id: string;
  room_id: string;
  socket_id: string;
  user_id: string;
  producer_infos: Array<CreateConsumersProducerInfoDto>;
};

type InsertConsumerDataInfoDto = {
  consumer_id: string;
  producer_id: string;
  status: 'user' | 'main';
};

export type InsertConsumerDatasDto = {
  transport_id: string;
  room_id: string;
  user_id: string;
  consumer_info: Array<InsertConsumerDataInfoDto>;
};

type CreateConsumerResult = {
  producer_id: string;
  consumer_id: string;
  kind: MediaKind;
  rtpParameters: RtpParameters;
};

export type CreateConsumerResults = Array<CreateConsumerResult>;
