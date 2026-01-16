import { CheckToolTicketFromRedis } from "@/3-1.infra/cache/redis/room/room.inbound";
import { Injectable } from "@nestjs/common";


@Injectable()
export class ToolConsumerService {

  constructor(
    private readonly checkTicket : CheckToolTicketFromRedis
  ) {}

  async checkTicketService() {

  }
};