import { Global, Module } from '@nestjs/common';
import { WHITEBOARD_WEBSOCKET } from '../websocket.constants';
import { WhiteboardWebsocket } from './whiteboard.service';

@Global()
@Module({
  providers: [
    WhiteboardWebsocket,
    { provide: WHITEBOARD_WEBSOCKET, useExisting: WhiteboardWebsocket },
  ],
  exports: [WHITEBOARD_WEBSOCKET, WhiteboardWebsocket],
})
export class WhiteboardWebsocketModule {}
