import { RoomEntry } from '../commands/dto';

export interface RoomCreateLockPort {
  get(roomId: string): Promise<RoomEntry> | undefined;
  set(roomId: string, inflight: Promise<RoomEntry>): void;
  delete(roomId: string): void;
}
