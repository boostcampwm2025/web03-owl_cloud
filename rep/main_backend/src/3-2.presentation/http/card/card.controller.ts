import { Body, Controller, HttpCode, Param, Patch, Post, Req, Sse, UseGuards, UsePipes, ValidationPipe, MessageEvent } from "@nestjs/common";
import { JwtGuard } from "../auth/guards";
import { type Request } from "express";
import { CardService } from "./card.service";
import { Payload } from "@app/auth/commands/dto";
import { CheckEtagsValidate, CheckEtagValidate, CreateCardItemValidate, CreateCardValidate, GetPresignedUrlsValidate, UpdateCardItemFileValdate } from "./card.validate";
import { AfterCreateCardItemDataInfo, AfterUpdateCardItemDataInfo, CheckCardItemDatasUrlProps, CheckCardItemDataUrlProps, CreateCardDto, CreateCardItemDataDto, UpdateCardItemInfoProps } from "@app/card/commands/dto";
import { MultiPartResponseDataDto, UploadMultipartDataDto } from "@app/card/queries/dto";
import { map, Observable } from "rxjs";
import { CHANNEL_SSE_NAME } from "@infra/channel/channel.constants";
import { RedisSseBrokerService } from "@infra/channel/redis/channel.service";


@Controller("api/cards")
export class CardController {
  constructor(
    private readonly cardService : CardService,
    private readonly redisSseBroker : RedisSseBrokerService
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

  // sse를 이용해서 해당 카드에 대해서 받아볼 수 있게 할 예정이다. ( 실시간 카드 확인 )
  @Sse("sse")
  sseCardItemListController(
    @Req() req : Request
  ) : Observable<MessageEvent> {
    const channel : string = `${CHANNEL_SSE_NAME.CARD_ITEMS}:list`;
    this.redisSseBroker.subscribe(channel); // 채널에 연결
    req.on("close", () => {
      this.redisSseBroker.release(channel); // 닫히면 channel을 release한다. 
    });
    // 유저에게 현재 card_item_list를 우선적으로 전달해준다. 
    
    // data에서 가져와서 유저에게 전달한다. -> 해당 payload를 data : any 에 맞게 변형 하는 pipe를 사용
    return this.redisSseBroker.onChannel(channel).pipe(
      map((payload) => ({
        data : payload.data
      }))
    );
  };

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

  // 추후에 인가를 추가 해야 한다. 유저는 자신의 카드에만 접근할 수 있는 권한이 주어진다.
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

  // 10mb 이하일 경우 이를 이용해서 검증
  @Post(":card_id/items/:item_id/check")
  @UseGuards(JwtGuard)
  @UsePipes(new ValidationPipe({
    transform : true,
    whitelist : true    
  }))
  @HttpCode(200) 
  async checkEtagController(
    @Body() dto : CheckEtagValidate,
    @Param("card_id") card_id : string,
    @Param("item_id") item_id : string
  ) : Promise<Record<string, string>> {
    const payloadDto : CheckCardItemDataUrlProps = {
      card_id, item_id, etag : dto.etag
    };
    await this.cardService.checkEtagService(payloadDto);
    return { "message" : "ok" };
  };

  // 10mb 이상일 경우 이를 이용해서 검증
  @Post(":card_id/items/:item_id/checks")
  @UseGuards(JwtGuard)
  @UsePipes(new ValidationPipe({
    transform : true,
    whitelist : true
  }))
  @HttpCode(200)
  async checkEtagsController(
    @Body() dto : CheckEtagsValidate,
    @Param("card_id") card_id : string,
    @Param("item_id") item_id : string
  ) : Promise<Record<string, string>> {
    const payloadDto : CheckCardItemDatasUrlProps = {
      ...dto, card_id, item_id
    };
    await this.cardService.checkEtagsService(payloadDto);
    return { "message" : "ok" };
  };

  // file에 내용만 update할때 사용하는 거 - 기존에 값을 덮어 쓴다 라는 의미가 강해서 Put으로 하기로 하였다. 
  // 만약 10mb 이상이라면 같은 파일이면 기존의 것을 이어서 받을 수 있도록 하는건 어떨지?
  @Patch(":card_id/items/:item_id/file")
  @UseGuards(JwtGuard)
  @UsePipes(new ValidationPipe({
    transform : true,
    whitelist : true
  }))
  async updateCardItemFileController(
    @Body() dto : UpdateCardItemFileValdate,
    @Param("card_id") card_id : string,
    @Param("item_id") item_id : string
  ) : Promise<AfterUpdateCardItemDataInfo> {
    const payloadDto : UpdateCardItemInfoProps = {
      ...dto, card_id, item_id
    };
    const res = await this.cardService.updateCardItemFileService(payloadDto);
    return res;
  }

};