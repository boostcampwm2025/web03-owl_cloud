import { Injectable } from '@nestjs/common';
import { ConsumerRepositoryPort } from '@app/sfu/ports';
import { Consumer } from 'mediasoup/types';

@Injectable()
export class ConsumerRepository implements ConsumerRepositoryPort {
  private readonly consumers = new Map<string, Consumer>();

  get(consumer_id: string) {
    return this.consumers.get(consumer_id);
  }
  set(consumer_id: string, consumer: Consumer) {
    this.consumers.set(consumer_id, consumer);
  }
  delete(consumer_id: string) {
    this.consumers.delete(consumer_id);
  }
}
