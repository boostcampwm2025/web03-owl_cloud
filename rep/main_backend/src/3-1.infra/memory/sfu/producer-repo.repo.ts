import { Injectable } from '@nestjs/common';
import { ProducerRepositoryPort } from '@app/sfu/ports';
import { Producer } from 'mediasoup/types';

@Injectable()
export class ProducerRepository implements ProducerRepositoryPort {
  private readonly producers = new Map<string, Producer>();

  get(producer_id: string) {
    return this.producers.get(producer_id);
  }
  set(producer_id: string, producer: Producer) {
    this.producers.set(producer_id, producer);
  }
  delete(producer_id: string) {
    this.producers.delete(producer_id);
  }
}
