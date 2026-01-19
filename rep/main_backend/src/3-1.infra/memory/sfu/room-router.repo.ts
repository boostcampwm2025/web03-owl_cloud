import { Injectable } from '@nestjs/common';
import { RoomRouterRepositoryPort } from '@app/sfu/ports';
import { RoomEntry } from '@app/sfu/commands/dto';

@Injectable()
export class RoomRouterRepository implements RoomRouterRepositoryPort {
  private readonly roomRouters = new Map<string, RoomEntry>();

  get(roomId: string) {
    return this.roomRouters.get(roomId);
  }
  set(roomId: string, entry: RoomEntry) {
    this.roomRouters.set(roomId, entry);
  }
  delete(roomId: string) {
    this.roomRouters.delete(roomId);
  }

  patch(room_id: string, patchEntry: (entry: RoomEntry) => void): void {
    const entry = this.roomRouters.get(room_id);
    if (!entry) return;
    patchEntry(entry);

    this.roomRouters.set(room_id, entry);
  }
}
