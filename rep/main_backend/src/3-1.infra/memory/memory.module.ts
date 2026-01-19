import { Global, Module } from '@nestjs/common';
import {
  ConsumerRepository,
  ProducerRepository,
  RoomCreateLockRepo,
  RoomRouterRepository,
} from './sfu';
import { TransportRepository } from './sfu/transport-repo';

@Global()
@Module({
  providers: [
    RoomRouterRepository,
    RoomCreateLockRepo,
    TransportRepository,
    ProducerRepository,
    ConsumerRepository,
  ],
  exports: [
    RoomRouterRepository,
    RoomCreateLockRepo,
    TransportRepository,
    ProducerRepository,
    ConsumerRepository,
  ],
})
export class MemoryModule {}
