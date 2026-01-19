import { Global, Module } from '@nestjs/common';
import { SIGNALING_WEBSOCKET } from '../websocket.constants';
import { SignalingWebsocket } from './signaling.service';

@Global()
@Module({
  providers: [
    SignalingWebsocket,
    { provide: SIGNALING_WEBSOCKET, useExisting: SignalingWebsocket },
  ],
  exports: [SIGNALING_WEBSOCKET, SignalingWebsocket],
})
export class SignalingBroadcasterModule {}
