import { Injectable } from '@nestjs/common';
import type { WebRtcTransport } from 'mediasoup/types';
import type { TransportRepositoryPort } from '@app/sfu/ports';

@Injectable()
export class TransportRepository implements TransportRepositoryPort {
  private readonly transports = new Map<string, WebRtcTransport>();
  get(id: string) {
    return this.transports.get(id);
  }
  set(id: string, t: WebRtcTransport) {
    this.transports.set(id, t);
  }
  delete(id: string) {
    this.transports.delete(id);
  }
}
