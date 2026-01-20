export type PauseProducerDto = {
  user_id: string;
  room_id: string;
  producer_id: string;
  kind: 'audio' | 'video';
};
