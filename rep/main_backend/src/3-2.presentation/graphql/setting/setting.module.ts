import { Module } from "@nestjs/common";
import { SettingGraphqlResolver } from "./setting.resolver";


@Module({
  providers : [SettingGraphqlResolver]
})
export class SettingGraphqlModule {};