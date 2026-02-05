import { Global, Module } from '@nestjs/common';
import {
  ConsumerRepository,
  ConsumerTimerRepository,
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
    ConsumerTimerRepository,
  ],
  exports: [
    RoomRouterRepository,
    RoomCreateLockRepo,
    TransportRepository,
    ProducerRepository,
    ConsumerRepository,
    ConsumerTimerRepository,
  ],
})
export class MemoryModule {}
