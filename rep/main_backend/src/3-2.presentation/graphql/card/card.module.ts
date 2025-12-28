import { Module } from "@nestjs/common";
import { CardGraphqlResover } from "./card.resolver";
import { CardGraphqlService } from "./card.service";


@Module({
  providers : [
    CardGraphqlResover, // controller의 역할을 하는 resolver 

    CardGraphqlService, // service의 역할을 하는 것
  ]
})
export class CardGraphqlModule {};