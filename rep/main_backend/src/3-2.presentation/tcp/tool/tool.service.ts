import { CheckToolTicketFromRedis } from '@/3-1.infra/cache/redis/room/room.inbound';
import { ToolEnterEvent } from '@infra/event-stream/event-stream.constants';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ToolConsumerService {
  constructor(private readonly checkTicket: CheckToolTicketFromRedis) {}

  async checkTicketService(dto: ToolEnterEvent): Promise<void> {
    const namespace: string = dto.room_id;
    const keyName: string = `${dto.user_id}:${dto.tool}:${dto.ticket}`;

    await this.checkTicket.select({ namespace, keyName });
  }
}
