import { idVo, uuidv7Vo } from '@domain/shared';
import { RoomParticipantProps } from '../vo';

export class RoomParticipant {
  private readonly id: RoomParticipantProps['id'];
  private readonly room_id: RoomParticipantProps['room_id'];
  private readonly user_id: RoomParticipantProps['user_id'];
  private readonly joined_at: RoomParticipantProps['joined_at'];
  private readonly left_at: Exclude<RoomParticipantProps['left_at'], undefined>;

  constructor({ id, room_id, user_id, joined_at, left_at = undefined }: RoomParticipantProps) {
    this.id = idVo(id);
    this.room_id = uuidv7Vo({ uuid: room_id, name: 'room_id' });
    this.user_id = uuidv7Vo({ uuid: user_id, name: 'user_id' });
    this.joined_at = joined_at instanceof Date ? joined_at : new Date();
    this.left_at = left_at && left_at instanceof Date ? left_at : null;

    Object.freeze(this);
  }

  getId(): RoomParticipantProps['id'] {
    return this.id;
  }
  getRoomId(): RoomParticipantProps['room_id'] {
    return this.room_id;
  }
  getUserId(): RoomParticipantProps['user_id'] {
    return this.user_id;
  }
  getJoinedAt(): RoomParticipantProps['joined_at'] {
    return this.joined_at;
  }
  getLeftAt(): Exclude<RoomParticipantProps['left_at'], undefined> {
    return this.left_at;
  }

  getData(): Required<RoomParticipantProps> {
    return {
      id: this.id,
      room_id: this.room_id,
      user_id: this.user_id,
      joined_at: this.joined_at,
      left_at: this.left_at,
    };
  }
}
