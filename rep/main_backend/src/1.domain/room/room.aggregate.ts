import { IdGenerator, MakeRandomStr } from '../shared';
import { Room, RoomParticipant } from './entities';
import {
  RoomParticipantProps,
  roomPasswordHashVo,
  RoomProps,
  RoomStatusProps,
  roomStatusVo,
  roomTitleVo,
} from './vo';

type CreateRoomInput = Omit<
  RoomProps,
  'room_id' | 'code' | 'created_at' | 'updated_at' | 'deleted_at'
>;

export class RoomAggregate {
  // 방
  private room: Room;

  // 방 인원들
  private participants: Array<RoomParticipant>;

  constructor({ room, participants = [] }: { room: Room; participants: Array<RoomParticipant> }) {
    this.room = room;
    this.participants = participants;
  }

  static create({
    input,
    roomIdGenerator,
    makeCodeString,
  }: {
    input: CreateRoomInput;
    roomIdGenerator: IdGenerator;
    makeCodeString: MakeRandomStr;
  }): RoomAggregate {
    const room_id: string = roomIdGenerator.generate();
    const code: string = makeCodeString.make(32);

    const room = new Room({
      ...input,
      room_id,
      code,
    });

    return new RoomAggregate({ room, participants: [] });
  }

  // 값을 변경하게 되었을때 사용
  private replaceRoom(patch: Partial<RoomProps>) {
    const current = this.room.getData();

    const nextStatus: RoomStatusProps = patch.status ? roomStatusVo(patch.status) : current.status;

    this.room = new Room({
      ...current,
      ...patch,
      status: nextStatus,
      updated_at: new Date(),
    });
  }

  // 비밀번호 부여
  setPasswordHash(password_hash: string) {
    const passwordHash = roomPasswordHashVo(password_hash);
    this.replaceRoom({ password_hash: passwordHash });
  }

  // 비밀번호 제거
  clearPassword() {
    this.replaceRoom({ password_hash: null });
  }

  // 제목 변경
  rename(title: string) {
    const titleValue = roomTitleVo(title);
    this.replaceRoom({ title });
  }

  // 방에 가입
  join({ user_id, joined_at = new Date() }: { user_id: string; joined_at: Date }) {
    // 방이 닫혀있으면 안된다.
    if (this.room.getStatus() !== 'open') {
      throw new Error('방이 닫힌 상태입니다.');
    }

    const participant = new RoomParticipant({
      id: 1,
      room_id: this.room.getRoomId(),
      user_id,
      joined_at,
      left_at: null,
    });

    this.participants = [...this.participants, participant];
  }

  // 데이터 가져오기
  getRoom(): Room {
    return this.room;
  }

  getRoomData(): Required<RoomProps> {
    return this.room.getData();
  }

  getRoomParticipants(): Array<RoomParticipant> {
    return this.participants;
  }

  getRoomParticipantData(): Array<RoomParticipantProps> {
    return this.participants.map((p) => p.getData());
  }
}
