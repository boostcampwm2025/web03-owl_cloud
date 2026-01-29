import { Global, Module } from '@nestjs/common';
import {
  CodeeditorRepository,
  PendingRepository,
  SnapStateRepository,
  WhiteboardRepository,
} from './tool';

@Global()
@Module({
  providers: [CodeeditorRepository, WhiteboardRepository, PendingRepository, SnapStateRepository],
  exports: [CodeeditorRepository, WhiteboardRepository, PendingRepository, SnapStateRepository],
})
export class MemoryModule {}
