import { RoomEntry } from "../commands/dto";


export interface RoomRouterRepositoryPort {
  get(roomId: string): RoomEntry | undefined;
  set(roomId: string, entry: RoomEntry): void;
  delete(roomId: string): void;
  patch(roomId: string, patch: (entry: RoomEntry) => void): void;
}
