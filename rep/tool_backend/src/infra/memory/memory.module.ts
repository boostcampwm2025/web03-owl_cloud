import { Global, Module } from '@nestjs/common';
import { CodeeditorRepository, WhiteboardRepository } from './tool';

@Global()
@Module({
  providers: [CodeeditorRepository, WhiteboardRepository],
  exports: [CodeeditorRepository, WhiteboardRepository],
})
export class MemoryModule {}
