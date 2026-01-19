import { NotAllowRoomDataUpdate, NotAllowRoomMemberOne } from '@error/application/room/room.error';
import { SelectDataFromCache } from '@app/ports/cache/cache.inbound';
import type { EventStreamPort } from '@app/ports/event-stream/event-stream.port';
import { Injectable } from '@nestjs/common';
import { DisConnectToolDto } from '../dto';
import { DeleteDataToCache } from '@app/ports/cache/cache.outbound';

type DisconnectUsecaseProps<T> = {
  toolLeftTopicName: string;
  checkUserPaylodFromCache: SelectDataFromCache<T>;
  deleteMainContentsToCache: DeleteDataToCache<T>;
};

@Injectable()
export class DisconnectToolUsecase<T> {
  private readonly checkUserPaylodFromCache: DisconnectUsecaseProps<T>['checkUserPaylodFromCache'];
  private readonly toolLeftTopicName: DisconnectUsecaseProps<T>['toolLeftTopicName'];
  private readonly deleteMainContentsToCache: DisconnectUsecaseProps<T>['deleteMainContentsToCache'];

  constructor(
    private readonly stream: EventStreamPort,
    {
      checkUserPaylodFromCache,
      toolLeftTopicName,
      deleteMainContentsToCache,
    }: DisconnectUsecaseProps<T>,
  ) {
    this.checkUserPaylodFromCache = checkUserPaylodFromCache;
    this.toolLeftTopicName = toolLeftTopicName;
    this.deleteMainContentsToCache = deleteMainContentsToCache;
  }

  async execute(dto: DisConnectToolDto): Promise<void> {
    // 1. 이 유저가 방에 있는지 해당 tool이 실제로 main_producer에 있는지 ( 선택 - 주인만 닫게 할 수 있다. )
    const checked: boolean = await this.checkUserPaylodFromCache.select({
      namespace: dto.room_id,
      keyName: `${dto.user_id}:${dto.tool}`,
    });
    if (!checked) throw new NotAllowRoomMemberOne();

    // 2. main_producer를 삭제한다.
    const deleted: boolean = await this.deleteMainContentsToCache.deleteNamespace(dto.room_id);
    if (!deleted) throw new NotAllowRoomDataUpdate();

    // 3. 이벤트를 전송한다.
    this.stream.emit(this.toolLeftTopicName, dto);
  }
}
