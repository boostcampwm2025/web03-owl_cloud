import { Body, Controller, HttpCode, Param, Post, Req, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { JwtGuard } from "../auth/guards";
import { type Request } from "express";
import { CardService } from "./card.service";
import { Payload } from "@app/auth/commands/dto";
import { CreateCardItemValidate, CreateCardValidate, GetPresignedUrlsValidate } from "./card.validate";
import { AfterCreateCardItemDataInfo, CreateCardDto, CreateCardItemDataDto } from "@app/card/commands/dto";
import { MultiPartResponseDataDto, UploadMultipartDataDto } from "@app/card/queries/dto";


@Controller("api/cards")
export class CardController {
  constructor(
    private readonly cardService : CardService
  ) {}

  @Post("")
  @UseGuards(JwtGuard)
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    })
  )
  async createCardController(
    @Req() req : Request,
    @Body() cardDto : CreateCardValidate
  ) : Promise<Record<string, string>> {
    const payload : Payload = ( req as any ).user;
    const dto : CreateCardDto = {
      ...cardDto,
      user_id : payload.user_id
    };
    const card_id : string = await this.cardService.createCardService(dto);
    return {card_id};
  };

  // 추후에 인가를 추가 해야 한다. 유저는 자신의 카드에만 접근할 수 있는 권한이 주어진다.
  @Post(":card_id/items")
  @UseGuards(JwtGuard)
  @UsePipes(new ValidationPipe({
    transform: true,
    whitelist: true,
  }))
  async createCardItemController(
    @Body() dto : CreateCardItemValidate,
    @Param("card_id") card_id : string
  ) : Promise<AfterCreateCardItemDataInfo> {
    // 저장할 루트
    const payloadDto : CreateCardItemDataDto = {
      ...dto,
      card_id,
    };
    const afterCardItemDto = await this.cardService.createCardItemService(payloadDto);
    return afterCardItemDto;
  };

  @Post(":card_id/items/:item_id/presigned_urls")
  @UseGuards(JwtGuard)
  @UsePipes(new ValidationPipe({
    transform : true,
    whitelist : true
  }))
  @HttpCode(200) // 200으로 response
  async getPresignedUrlsController(
    @Body() dto : GetPresignedUrlsValidate,
    @Param("card_id") card_id : string,
    @Param("item_id") item_id : string
  ) : Promise<MultiPartResponseDataDto> {
    const payloadDto : UploadMultipartDataDto = {
      ...dto,
      card_id, item_id
    };
    const presigned_urls : MultiPartResponseDataDto = await this.cardService.getPresignedUrlsService(payloadDto);
    return presigned_urls
  }

};