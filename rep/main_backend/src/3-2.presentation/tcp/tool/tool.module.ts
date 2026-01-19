import { Module } from '@nestjs/common';
import { ToolConsumerController } from './tool.controller';
import { ToolConsumerService } from './tool.service';

@Module({
  controllers: [ToolConsumerController],
  providers: [ToolConsumerService],
})
export class ToolConsumerModule {}
