import { Global, Module } from "@nestjs/common";
import { RoomCreateLockRepo, RoomRouterRepository } from "./sfu";
import { TransportRepository } from "./sfu/transport-repo";


@Global()
@Module({
  providers : [
    RoomRouterRepository,
    RoomCreateLockRepo,
    TransportRepository
  ],
  exports : [
    RoomRouterRepository,
    RoomCreateLockRepo,
    TransportRepository
  ]
})
export class MemoryModule {};