import { Global, Module } from '@nestjs/common';
import { CODEEDITOR_WEBSOCKET } from '../websocket.constants';
import { CodeeditorWebsocket } from './codeeditor.service';

@Global()
@Module({
  providers: [
    CodeeditorWebsocket,
    {
      provide: CODEEDITOR_WEBSOCKET,
      useExisting: CodeeditorWebsocket,
    },
  ],
  exports: [CodeeditorWebsocket, CODEEDITOR_WEBSOCKET],
})
export class CodeeditorWebsocketModule {}
