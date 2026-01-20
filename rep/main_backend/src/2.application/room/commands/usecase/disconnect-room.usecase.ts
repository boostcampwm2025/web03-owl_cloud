import { Injectable } from '@nestjs/common';
import { DisconnectRoomDto } from '../dto';
import { UpdateValueToDb } from '@app/ports/db/db.outbound';
import { DeleteDatasToCache } from '@app/ports/cache/cache.outbound';

type DisconnectRoomUsecaseProps<T, CT> = {
  updateRoomParticipantInfoToDb: UpdateValueToDb<T>; // db에 방문자 정보를 수정하는 로직
  deleteRoomDataToCache: DeleteDatasToCache<CT>; // db에 방에 대한 데이터 삭제
};

@Injectable()
export class DisconnectRoomUsecase<T, CT> {
  private readonly updateRoomParticipantInfoToDb: DisconnectRoomUsecaseProps<
    T,
    CT
  >['updateRoomParticipantInfoToDb'];
  private readonly deleteRoomDataToCache: DisconnectRoomUsecaseProps<
    T,
    CT
  >['deleteRoomDataToCache'];

  constructor({
    updateRoomParticipantInfoToDb,
    deleteRoomDataToCache,
  }: DisconnectRoomUsecaseProps<T, CT>) {
    this.updateRoomParticipantInfoToDb = updateRoomParticipantInfoToDb;
    this.deleteRoomDataToCache = deleteRoomDataToCache;
  }

  async execute(dto: DisconnectRoomDto): Promise<void> {
    // 1. db에 방문자 정보를 수정해야 한다. ( room_id, user_id를 같이 주어서 lefted_at을 추가 )
    await this.updateRoomParticipantInfoToDb.update({
      uniqueValue: dto.room_id,
      updateColName: '',
      updateValue: dto.user_id,
    });

    // 2. socket, members, info를 수정 혹은 삭제해야 한다. ( 방에 인원이 하나도 없을때 info에 시간을 부여할수도 있다. - 나중에 추가 )
    // room_id, socket_id, user_id ( 이 값들이 들어가야 한다. ) -> 여기서 유저가 만약 main_producer를 하고 있다면 그것도 삭제해야 한다.
    await this.deleteRoomDataToCache.deleteNamespaces([dto.room_id, dto.socket_id, dto.user_id]);
  }
}
