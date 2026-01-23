import { Module } from '@nestjs/common';
import { WhiteboardWebsocketGateway } from './whiteboard.gateway';
import { WhiteboardService } from './whiteboard.service';
import { ConfigService } from '@nestjs/config';
import { WHITEBOARD_WEBSOCKET } from '@/infra/websocket/websocket.constants';
import { WhiteboardWebsocket } from '@/infra/websocket/whiteboard/whiteboard.service';

@Module({
  providers: [
    ConfigService,
    WhiteboardWebsocketGateway,
    WhiteboardService,
    {
      provide: WHITEBOARD_WEBSOCKET,
      useClass: WhiteboardWebsocket,
    },
    WhiteboardWebsocket,
  ],
})
export class WhiteboardModule {}
