import { uuidv7Vo } from '@domain/shared';
import {
  roomCodeVo,
  roomMaxParticipantsVo,
  roomPasswordHashVo,
  RoomProps,
  roomStatusVo,
  roomTitleVo,
} from '../vo';

export class Room {
  private readonly room_id: RoomProps['room_id'];
  private readonly code: RoomProps['code'];
  private readonly title: RoomProps['title'];
  private readonly password_hash: Exclude<RoomProps['password_hash'], undefined>;
  private readonly owner_user_id: RoomProps['owner_user_id'];
  private readonly max_participants: RoomProps['max_participants'];
  private readonly status: RoomProps['status'];
  private readonly created_at: Exclude<RoomProps['created_at'], undefined>;
  private readonly updated_at: Exclude<RoomProps['updated_at'], undefined>;
  private readonly deleted_at: Exclude<RoomProps['deleted_at'], undefined>;

  constructor({
    room_id,
    code,
    title,
    password_hash = undefined,
    owner_user_id,
    max_participants,
    status,
    created_at = new Date(),
    updated_at = new Date(),
    deleted_at = undefined,
  }: RoomProps) {
    this.room_id = uuidv7Vo({ uuid: room_id.trim(), name: 'room_id' });
    this.code = roomCodeVo(code);
    this.title = roomTitleVo(title);
    this.password_hash = password_hash ? roomPasswordHashVo(password_hash) : null;
    this.owner_user_id = uuidv7Vo({ uuid: owner_user_id.trim(), name: 'owner_user_id' });
    this.max_participants = roomMaxParticipantsVo(max_participants);
    this.status = roomStatusVo(status);
    this.created_at = created_at && created_at instanceof Date ? created_at : new Date();
    this.updated_at = updated_at && updated_at instanceof Date ? updated_at : new Date();
    this.deleted_at = deleted_at && deleted_at instanceof Date ? deleted_at : null;

    Object.freeze(this);
  }

  getRoomId(): RoomProps['room_id'] {
    return this.room_id;
  }
  getCode(): RoomProps['code'] {
    return this.code;
  }
  getTitle(): RoomProps['title'] {
    return this.title;
  }
  getPasswordHash(): Exclude<RoomProps['password_hash'], undefined> {
    return this.password_hash;
  }
  getOwnerUserId(): RoomProps['owner_user_id'] {
    return this.owner_user_id;
  }
  getMaxParticipants(): RoomProps['max_participants'] {
    return this.max_participants;
  }
  getStatus(): RoomProps['status'] {
    return this.status;
  }
  getCreatedAt(): Exclude<RoomProps['created_at'], undefined> {
    return this.created_at;
  }
  getUpdatedAt(): Exclude<RoomProps['updated_at'], undefined> {
    return this.updated_at;
  }
  getDeletedAt(): Exclude<RoomProps['deleted_at'], undefined> {
    return this.deleted_at;
  }

  getData(): Required<RoomProps> {
    return {
      room_id: this.room_id,
      code: this.code,
      title: this.title,
      password_hash: this.password_hash,
      owner_user_id: this.owner_user_id,
      max_participants: this.max_participants,
      status: this.status,
      created_at: this.created_at,
      updated_at: this.updated_at,
      deleted_at: this.deleted_at,
    };
  }
}
