import { MakeToken } from '@app/ports/share';
import { SelectDataFromCache } from '@app/ports/cache/cache.inbound';
import { Injectable } from '@nestjs/common';
import { ConnectToolDto } from '../dto';
import { NotAllowRoomMemberOne } from '@error/application/room/room.error';

type ConnectToolUsecaseProps<T> = {
  checkUserPaylodFromCache: SelectDataFromCache<T>;
  makeToolTicket: MakeToken;
};

@Injectable()
export class ConnectToolUsecase<T> {
  private readonly checkUserPaylodFromCache: ConnectToolUsecaseProps<T>['checkUserPaylodFromCache'];
  private readonly makeToolTicket: ConnectToolUsecaseProps<T>['makeToolTicket'];

  constructor({ checkUserPaylodFromCache, makeToolTicket }: ConnectToolUsecaseProps<T>) {
    this.checkUserPaylodFromCache = checkUserPaylodFromCache;
    this.makeToolTicket = makeToolTicket;
  }

  async execute(dto: ConnectToolDto): Promise<string> {
    // 1. user가 실제로 방에 있는지 그리고 현재 producer에 올라와있는지 확인  keyName은 user_id:tool로 간다.
    const checked: boolean = await this.checkUserPaylodFromCache.select({
      namespace: dto.room_id,
      keyName: `${dto.user_id}:${dto.tool}`,
    });
    if (!checked) throw new NotAllowRoomMemberOne();

    // 2. ticket 발급
    const tickect: string = await this.makeToolTicket.make(dto);

    return tickect;
  }
}
