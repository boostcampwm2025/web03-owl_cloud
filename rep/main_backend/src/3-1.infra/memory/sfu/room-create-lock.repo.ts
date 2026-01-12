import { RoomEntry } from '@app/sfu/commands/dto';
import { RoomCreateLockPort } from '@app/sfu/ports';
import { Injectable } from '@nestjs/common';


@Injectable()
export class RoomCreateLockRepo implements RoomCreateLockPort {
  private readonly creating = new Map<string, Promise<RoomEntry>>();

  get(roomId: string) { return this.creating.get(roomId); }
  set(roomId: string, inflight: Promise<RoomEntry>) { this.creating.set(roomId, inflight); }
  delete(roomId: string) { this.creating.delete(roomId); }
}
