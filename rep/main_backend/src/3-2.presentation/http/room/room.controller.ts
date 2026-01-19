import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { JwtGuard } from '../auth/guards';
import { type Request } from 'express';
import { CreateRoomValidate } from './room.validate';
import { RoomService } from './room.service';
import { CreateRoomDto, CreateRoomResult } from '@app/room/commands/dto';
import { Payload } from '@app/auth/commands/dto';
import { GetRoomInfoResult } from '@app/room/queries/dto';

@Controller('rooms')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  // 방을 생성할때 사용되는 api
  @Post('')
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  )
  @UseGuards(JwtGuard)
  async createRoomController(
    @Req() req: Request,
    @Body() validate: CreateRoomValidate,
  ): Promise<CreateRoomResult> {
    const payload: Payload = (req as any).user;
    const dto: CreateRoomDto = {
      ...validate,
      user_id: payload.user_id,
    };
    return this.roomService.createRoomService(dto);
  }

  @Get(':code')
  async getRoomInfoController(@Param('code') code: string): Promise<GetRoomInfoResult> {
    return this.roomService.getRoomInfoService(code);
  }
}
