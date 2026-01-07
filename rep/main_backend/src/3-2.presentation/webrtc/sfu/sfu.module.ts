import { MediaModule } from "@infra/media/media.module";
import { Module } from "@nestjs/common";


@Module({
  imports : [
    MediaModule
  ]
})
export class SfuModule {};