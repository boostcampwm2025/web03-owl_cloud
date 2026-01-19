import { SelectDataFromCache } from '@app/ports/cache/cache.inbound';
import { DeleteValueToDb, InsertValueToDb } from '@app/ports/db/db.outbound';
import { SelectDataFromDb } from '@app/ports/db/db.inbound';
import { Injectable } from '@nestjs/common';
import { InsertDataToCache } from '@app/ports/cache/cache.outbound';
import { ConnectResult, ConnectRoomDto, InsertRoomDataDto } from '../dto';
import { RoomProps } from '@domain/room/vo';
import { CompareHash } from '@domain/shared';
import {
  NotAcceptRoomMembers,
  NotAcceptRoomPassword,
  NotAllowRoomDataUpdate,
  NotAllowRoomParticipantData,
  NotInputRoomPassword,
  NotRoomData,
  NotRoomInfoData,
} from '@error/application/room/room.error';
import { RoomInfoValues } from '../../dtos';
import { RoomAggregate } from '@domain/room/room.aggregate';
import { Room, RoomParticipant } from '@domain/room/entities';

type ConnectRoomUsecaseProps<T, CT> = {
  selectRoomDataFromDb: SelectDataFromDb<T>; // 방에 정보를 찾는데 필요한 객체
  compareRoomPasswordHash: CompareHash; // 방에 비밀번호를 확인하는 객체
  selectRoomInfoDataFromCache: SelectDataFromCache<CT>; // 방에 info를 cache에서 찾는다.
  insertRoomParticipantInfoDataToDb: InsertValueToDb<T>; // 방에 참가자 정보를 cache에 입력한다.
  insertRoomDatasToCache: InsertDataToCache<CT>; // 방 INFO 수정, members추가, 방 socket 정보 추가
  deleteRoomParticipantInfoDataToDb: DeleteValueToDb<T>; // cache에서 에러가 발생하면 해당 db에 데이터를 삭제해야 한다.
};

@Injectable()
export class ConnectRoomUsecase<T, CT> {
  private readonly selectRoomDataFromDb: ConnectRoomUsecaseProps<T, CT>['selectRoomDataFromDb'];
  private readonly compareRoomPasswordHash: ConnectRoomUsecaseProps<
    T,
    CT
  >['compareRoomPasswordHash'];
  private readonly selectRoomInfoDataFromCache: ConnectRoomUsecaseProps<
    T,
    CT
  >['selectRoomInfoDataFromCache'];
  private readonly insertRoomParticipantInfoDataToDb: ConnectRoomUsecaseProps<
    T,
    CT
  >['insertRoomParticipantInfoDataToDb'];
  private readonly insertRoomDatasToCache: ConnectRoomUsecaseProps<T, CT>['insertRoomDatasToCache'];
  private readonly deleteRoomParticipantInfoDataToDb: ConnectRoomUsecaseProps<
    T,
    CT
  >['deleteRoomParticipantInfoDataToDb'];

  constructor({
    selectRoomDataFromDb,
    compareRoomPasswordHash,
    selectRoomInfoDataFromCache,
    insertRoomParticipantInfoDataToDb,
    insertRoomDatasToCache,
    deleteRoomParticipantInfoDataToDb,
  }: ConnectRoomUsecaseProps<T, CT>) {
    this.selectRoomDataFromDb = selectRoomDataFromDb;
    this.compareRoomPasswordHash = compareRoomPasswordHash;
    this.selectRoomInfoDataFromCache = selectRoomInfoDataFromCache;
    this.insertRoomParticipantInfoDataToDb = insertRoomParticipantInfoDataToDb;
    this.insertRoomDatasToCache = insertRoomDatasToCache;
    this.deleteRoomParticipantInfoDataToDb = deleteRoomParticipantInfoDataToDb;
  }

  async execute(dto: ConnectRoomDto): Promise<ConnectResult> {
    // 1. db에서 open된 방중 code와 맞는 정보를 찾는다. ( code를 이용해서 )
    const room: RoomProps | undefined = await this.selectRoomDataFromDb.select({
      attributeName: '',
      attributeValue: dto.code,
    }); // 열의 이름은 해당 infra에서 추가하는게 좋아보인다.
    if (!room) throw new NotRoomData(); // 방 정보가 없을때 에러 발생 시켜야 함
    // 비밀번호 체크 -> 잠금이 있어야 하지 않나 싶은데 여기서는 잠글수도 없기는 하다.
    if (room.password_hash) {
      if (!dto.password) throw new NotInputRoomPassword();
      const roomPasswordChecked: boolean = await this.compareRoomPasswordHash.compare({
        value: dto.password,
        hash: room.password_hash,
      });
      if (!roomPasswordChecked) throw new NotAcceptRoomPassword();
    }

    // 2. redis에서 해당 데이터를 찾는다. ( 없으면 에러 )
    const roomInfo: RoomInfoValues | undefined = await this.selectRoomInfoDataFromCache.select({
      namespace: room.room_id,
      keyName: '',
    }); // room_id만 있으면 된다.
    if (!roomInfo) throw new NotRoomInfoData();
    //  인원수 체크 - 걸러 내야 한다.
    if (roomInfo.current_particiants + 1 > roomInfo.max_particiants)
      throw new NotAcceptRoomMembers();

    // 3. db에 접속 정보를 저장한다.
    let dbSaved: boolean = false;
    if (!dto.is_guest) {
      // guest는 저장을 하지 않는다.
      const roomAggregate = new RoomAggregate({
        room: new Room({ ...room }),
        participants: [
          new RoomParticipant({
            id: 1,
            room_id: room.room_id,
            user_id: dto.user_id,
            joined_at: new Date(),
          }),
        ],
      }); // 정합성 체크
      const insertRoomPaticipantChecked: boolean =
        await this.insertRoomParticipantInfoDataToDb.insert(
          roomAggregate.getRoomParticipantData().at(-1),
        );
      dbSaved = true;
      if (!insertRoomPaticipantChecked) throw new NotAllowRoomParticipantData();
    }

    try {
      // 4. redis에 해당 user에 대한 정보를 저장한다. ( 멤버 등록, 정보 수정, socket 관리 ) -> 한번에 저장해서 정합성 체크
      const insertCacheData: InsertRoomDataDto = {
        ...dto,
        room_id: room.room_id,
      };
      const insertCacheDataChecked: boolean =
        await this.insertRoomDatasToCache.insert(insertCacheData);
      if (!insertCacheDataChecked) throw new NotAllowRoomDataUpdate();

      // 5. room_id에 대한 정보를 반환해야 한다.
      return { room_id: room.room_id };
    } catch (err) {
      // 4-1. 에러가 나면 해당 db에 접속정보를 삭제해야 한다. ( room_id - user_id - lefted_at이 비어있는값 삭제 ) -> 방이아닌 접속 기록을 해야함
      if (dbSaved)
        await this.deleteRoomParticipantInfoDataToDb.delete({
          uniqueValue: room.room_id,
          addOption: dto.user_id,
        });
      throw err;
    }
  }
}
