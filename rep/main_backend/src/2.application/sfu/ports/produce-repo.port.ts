import { Producer } from 'mediasoup/types';

export interface ProducerRepositoryPort {
  get(id: string): Producer | undefined; // producer_id에 따른 producer
  set(id: string, producer: Producer): void;
  delete(id: string): void;
}
