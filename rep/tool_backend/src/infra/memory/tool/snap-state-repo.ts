import { Injectable } from '@nestjs/common';
import { SnapState } from './yjs-repo';

@Injectable()
export class SnapStateRepository {
  private snapState = new Map<string, SnapState>();

  get(room_id: string): SnapState | undefined {
    return this.snapState.get(room_id);
  }

  set(room_id: string, s: SnapState): void {
    this.snapState.set(room_id, s);
  }

  delete(room_id: string): void {
    this.snapState.delete(room_id);
  }
}
