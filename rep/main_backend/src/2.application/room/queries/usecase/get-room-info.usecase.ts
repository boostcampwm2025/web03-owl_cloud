import { SelectDataFromDb } from '@/2.application/ports/db/db.inbound';
import { SelectDataFromCache } from '@app/ports/cache/cache.inbound';
import { Injectable } from '@nestjs/common';
import { GetRoomInfoCacheResult, GetRoomInfoDbResult, GetRoomInfoResult } from '../dto';
import { NotRoomData } from '@error/application/room/room.error';

type GetRoomInfoUsecaseProps<T, CT> = {
  selectRoomIdFromDb: SelectDataFromDb<T>;
  selectRoomInfoFromCache: SelectDataFromCache<CT>; // 현재 방의 인원등 정보를 얻을때 사용
};

@Injectable()
export class GetRoomInfoUsecase<T, CT> {
  private readonly selectRoomIdFromDb: GetRoomInfoUsecaseProps<T, CT>['selectRoomIdFromDb'];
  private readonly selectRoomInfoFromCache: GetRoomInfoUsecaseProps<
    T,
    CT
  >['selectRoomInfoFromCache'];

  constructor({ selectRoomIdFromDb, selectRoomInfoFromCache }: GetRoomInfoUsecaseProps<T, CT>) {
    this.selectRoomIdFromDb = selectRoomIdFromDb;
    this.selectRoomInfoFromCache = selectRoomInfoFromCache;
  }

  async execute(code: string): Promise<GetRoomInfoResult> {
    // 1. room_id를 가져온다.
    const roomInfoFromDb: GetRoomInfoDbResult | undefined = await this.selectRoomIdFromDb.select({
      attributeName: '',
      attributeValue: code,
    });
    if (!roomInfoFromDb) throw new NotRoomData();

    // 2. room에 대한 정보를 가져온다.
    const roomInfoFromCache: GetRoomInfoCacheResult = await this.selectRoomInfoFromCache.select({
      namespace: roomInfoFromDb.room_id,
      keyName: '',
    });

    return {
      ...roomInfoFromCache,
      title: roomInfoFromDb.title,
      has_password: roomInfoFromDb.has_password,
      host_nickname: roomInfoFromDb.host_nickname,
    };
  }
}
