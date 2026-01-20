export type StopScreenProducerDto = {
  user_id: string;
  room_id: string;
};

export type StopScreenProducerCacheInfoResult = {
  main_producer_id: string | null;
  sub_producer_id: string | null;
};

export type StopScreenProducerResult = {
  main: boolean;
  sub: boolean;
};
