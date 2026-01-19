import { Consumer } from 'mediasoup/types';

export interface ConsumerRepositoryPort {
  get(id: string): Consumer | undefined;
  set(id: string, consumer: Consumer): void;
  delete(id: string): void;
}
