import { Global, Module } from '@nestjs/common';
import { MediasoupService } from './mediasoup/media';
import { MediasoupTransportFactory } from './mediasoup/sfu/sfu.outbound';

@Global()
@Module({
  providers: [MediasoupService, MediasoupTransportFactory],
  exports: [MediasoupService, MediasoupTransportFactory],
})
export class MediaModule {}
