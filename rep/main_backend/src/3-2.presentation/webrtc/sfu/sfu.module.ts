import { MediaModule } from "@infra/media/media.module";
import { Module } from "@nestjs/common";
import { SfuService } from "./sfu.service";


@Module({
  imports : [
    MediaModule
  ],
  providers : [
    SfuService,
  ],
  exports : [
    SfuService,
  ]
})
export class SfuModule {};