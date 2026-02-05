import { ConsumerTimerRepositoryPort } from '@app/sfu/ports';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ConsumerTimerRepository implements ConsumerTimerRepositoryPort {
  private readonly timers = new Map<string, NodeJS.Timeout>();

  get(consumer_id: string) {
    return this.timers.get(consumer_id);
  }

  set(consumer_id: string, timer: NodeJS.Timeout) {
    this.timers.set(consumer_id, timer);
  }

  delete(consumer_id: string) {
    this.timers.delete(consumer_id);
  }

  clear(consumer_id: string) {
    const t = this.timers.get(consumer_id);
    if (t) clearTimeout(t);
    this.timers.delete(consumer_id);
  }
}
