import { Producer } from 'mediasoup/types';

export interface ProducerRepositoryPort {
  get(id: string): Producer | undefined;
  set(id: string, producer: Producer): void;
  delete(id: string): void;
}
