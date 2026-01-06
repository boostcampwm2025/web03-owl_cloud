import { idVo, uuidv7Vo } from "@/1.domain/shared";
import { RoomMaxParticipantProps } from "../vo";


export class RoomParticipant {

  private readonly id : RoomMaxParticipantProps["id"];
  private readonly room_id : RoomMaxParticipantProps["room_id"];
  private readonly user_id : RoomMaxParticipantProps["user_id"];
  private readonly joined_at : RoomMaxParticipantProps["joined_at"];
  private readonly left_at : Exclude<RoomMaxParticipantProps["left_at"], undefined>;

  constructor({
    id, room_id, user_id, joined_at, left_at = undefined
  } : RoomMaxParticipantProps) {
    this.id = idVo(id);
    this.room_id = uuidv7Vo({ uuid : room_id, name : "room_id" });
    this.user_id = uuidv7Vo({ uuid : user_id, name : "user_id" });
    this.joined_at = joined_at instanceof Date ? joined_at : new Date();
    this.left_at = left_at && left_at instanceof Date ? left_at : null;

    Object.freeze(this);
  };

  getId() : RoomMaxParticipantProps["id"] { return this.id; };
  getRoomId() : RoomMaxParticipantProps["room_id"] { return this.room_id; };
  getUserId() : RoomMaxParticipantProps["user_id"] { return this.user_id; };
  getJoinedAt() : RoomMaxParticipantProps["joined_at"] { return this.joined_at; };
  getLeftAt() : Exclude<RoomMaxParticipantProps["left_at"], undefined> { return this.left_at; };

  getData() : Required<RoomMaxParticipantProps> {
    return {
      id : this.id,
      room_id : this.room_id,
      user_id : this.user_id,
      joined_at : this.joined_at,
      left_at : this.left_at
    };
  };

};