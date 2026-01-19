import { Module } from '@nestjs/common';
import { WhiteboardWebsocketGateway } from './whiteboard.gateway';
import { WhiteboardService } from './whiteboard.service';
import { ConfigService } from '@nestjs/config';

@Module({
  providers: [ConfigService, WhiteboardWebsocketGateway, WhiteboardService],
})
export class WhiteboardModule {}
