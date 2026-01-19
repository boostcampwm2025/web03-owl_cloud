import { SelectDataFromCache } from '@app/ports/cache/cache.inbound';
import { Injectable } from '@nestjs/common';
import { InsertToolInfoData, OpenToolDto } from '../dto';
import { NotAllowRoomMember, NotInsertRoomTicketData } from '@error/application/room/room.error';
import { MakeToken } from '@app/ports/share';
import { InsertDataToCache } from '@app/ports/cache/cache.outbound';

type OpenToolUsecaseProps<T> = {
  checkUserPaylodFromCache: SelectDataFromCache<T>;
  makeToolTicket: MakeToken;
  insertToolTicketToCache: InsertDataToCache<T>;
};

@Injectable()
export class OpenToolUsecase<T> {
  private readonly checkUserPaylodFromCache: OpenToolUsecaseProps<T>['checkUserPaylodFromCache'];
  private readonly makeToolTicket: OpenToolUsecaseProps<T>['makeToolTicket'];
  private readonly insertToolTicketToCache: OpenToolUsecaseProps<T>['insertToolTicketToCache'];

  constructor({
    checkUserPaylodFromCache,
    makeToolTicket,
    insertToolTicketToCache,
  }: OpenToolUsecaseProps<T>) {
    this.checkUserPaylodFromCache = checkUserPaylodFromCache;
    this.makeToolTicket = makeToolTicket;
    this.insertToolTicketToCache = insertToolTicketToCache;
  }

  async execute(dto: OpenToolDto): Promise<string> {
    // 1. 방에서 보낸것이 맞는지 확인 namespace = room_id, keyname = user_id
    const checked: boolean = await this.checkUserPaylodFromCache.select({
      namespace: dto.room_id,
      keyName: dto.user_id,
    });
    if (!checked) throw new NotAllowRoomMember(); // 방에 해당 인원이 없음

    // 2. 서명화
    const ticket: string = await this.makeToolTicket.make(dto);

    // 3. cache에 저장
    const insertPayload: InsertToolInfoData = { ...dto, ticket };
    const inserted: boolean = await this.insertToolTicketToCache.insert(insertPayload);
    if (!inserted) throw new NotInsertRoomTicketData();

    // 4. 반환
    return ticket;
  }
}
