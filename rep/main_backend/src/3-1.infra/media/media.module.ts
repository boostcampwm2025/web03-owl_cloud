import { Module } from "@nestjs/common";
import { MediasoupService } from "./mediasoup/media";


@Module({
  providers : [
    MediasoupService,
  ],
  exports : [
    MediasoupService,
  ]
})
export class MediaModule {};