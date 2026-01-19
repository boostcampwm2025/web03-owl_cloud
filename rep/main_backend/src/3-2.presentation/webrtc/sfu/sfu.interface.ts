import { RouterFactoryPort } from '@app/sfu/ports';
import { MediasoupService } from '@infra/media/mediasoup/media';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MediasoupRouterFactory implements RouterFactoryPort {
  constructor(private readonly mediasoupService: MediasoupService) {}

  async createRouter() {
    return this.mediasoupService.createRouterOnPickedWorker();
  }
}
