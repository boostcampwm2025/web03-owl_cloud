import { Injectable } from '@nestjs/common';
import { CreateRoomDto, CreateRoomResult } from '../dto';
import { MakeHashPort } from '@app/ports/share';
import { IdGenerator, MakeRandomStr } from '@domain/shared';
import { RoomAggregate } from '@domain/room/room.aggregate';
import { RoomProps } from '@domain/room/vo';
import { DeleteValueToDb, InsertValueToDb } from '@app/ports/db/db.outbound';
import { InsertDataToCache } from '@app/ports/cache/cache.outbound';
import {
  NotInsertRoomDataToCache,
  NotInsertRoomDataToDb,
} from '@error/application/room/room.error';

type CreateRoomUsecaseProps<T, CT> = {
  passwordHash: MakeHashPort; // 비밀번호를 해쉬화 하기 위함
  roomIdGenerator: IdGenerator; // room_id 생성
  makeRoomCodeGenerator: MakeRandomStr; // code를 자동으로 생성함
  insertRoomDataToDb: InsertValueToDb<T>; // room에 데이터를 저장 한다.
  insertRoomDataToCache: InsertDataToCache<CT>; // room 데이터를 cache에 저장한다.
  deleteRoomDataToDb: DeleteValueToDb<T>; // cache저장에 실패하면 여기서 db에 데이터도 삭제를 해준다.
};

@Injectable()
export class CreateRoomUsecase<T, CT> {
  private readonly passwordHash: CreateRoomUsecaseProps<T, CT>['passwordHash'];
  private readonly roomIdGenerator: CreateRoomUsecaseProps<T, CT>['roomIdGenerator'];
  private readonly makeRoomCodeGenerator: CreateRoomUsecaseProps<T, CT>['makeRoomCodeGenerator'];
  private readonly insertRoomDataToDb: CreateRoomUsecaseProps<T, CT>['insertRoomDataToDb'];
  private readonly insertRoomDataToCache: CreateRoomUsecaseProps<T, CT>['insertRoomDataToCache'];
  private readonly deleteRoomDataToDb: CreateRoomUsecaseProps<T, CT>['deleteRoomDataToDb'];

  constructor({
    passwordHash,
    roomIdGenerator,
    makeRoomCodeGenerator,
    insertRoomDataToDb,
    insertRoomDataToCache,
    deleteRoomDataToDb,
  }: CreateRoomUsecaseProps<T, CT>) {
    this.passwordHash = passwordHash;
    this.roomIdGenerator = roomIdGenerator;
    this.makeRoomCodeGenerator = makeRoomCodeGenerator;
    this.insertRoomDataToDb = insertRoomDataToDb;
    this.insertRoomDataToCache = insertRoomDataToCache;
    this.deleteRoomDataToDb = deleteRoomDataToDb;
  }

  async execute(dto: CreateRoomDto): Promise<CreateRoomResult> {
    // 1. 데이터 정합성 파악 후 자동 code 비밀번호가 있다면 비밀번호 해시화
    // 1-1. 비밀번호 확인후 해쉬화
    let password_hash: string | null = null;
    if (dto.password) password_hash = await this.passwordHash.makeHash(dto.password);

    // 1-2. 정합성 파악
    const roomAggregate = RoomAggregate.create({
      input: {
        title: dto.title,
        password_hash,
        owner_user_id: dto.user_id,
        max_participants: dto.max_participants,
        status: 'open',
      },
      roomIdGenerator: this.roomIdGenerator,
      makeCodeString: this.makeRoomCodeGenerator,
    });
    const room: Required<RoomProps> = roomAggregate.getRoomData(); // room 데이터 가져오기

    // 2. db에 rooms 저장
    const inserted = await this.insertRoomDataToDb.insert(room);
    if (!inserted) throw new NotInsertRoomDataToDb();

    // 3. cache에 관련 room 관련 info 저장
    try {
      const inserted = await this.insertRoomDataToCache.insert(room);
      if (!inserted) throw new NotInsertRoomDataToCache();

      // 결과값 반환 ( 필요하면 방 uuid도 가능 )
      return {
        code: room.code,
      };
    } catch (err) {
      // 4. cache에서 에러가 발생하면 db에도 삭제해주어야 한다. ( soft 삭제 말고 hard 삭제 해야함 빌드 오류이기 때문 )
      await this.deleteRoomDataToDb.delete({ uniqueValue: room.room_id, addOption: undefined });
      throw err;
    }
  }
}
