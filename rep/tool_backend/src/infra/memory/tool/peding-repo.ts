import { Injectable } from '@nestjs/common';
import { Pending } from './yjs-repo';

@Injectable()
export class PendingRepository {
  private pending = new Map<string, Pending>();

  get(room_id: string): Pending | undefined {
    return this.pending.get(room_id);
  }

  set(room_id: string, p: Pending) {
    this.pending.set(room_id, p);
  }

  delete(room_id: string): void {
    const p = this.pending.get(room_id);
    if (p?.timer) clearTimeout(p.timer);
    this.pending.delete(room_id);
  }
}
