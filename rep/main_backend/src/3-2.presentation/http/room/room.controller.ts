import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { JwtGuard } from '../auth/guards';
import { type Request } from 'express';
import { CreateRoomValidate, UpdateRoomPasswordValidate } from './room.validate';
import { RoomService } from './room.service';
import { CreateRoomDto, CreateRoomResult, UpdateRoomPasswordDto } from '@app/room/commands/dto';
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

  // 방의 정보를 가져오는 로직
  @Get(':code')
  async getRoomInfoController(@Param('code') code: string): Promise<GetRoomInfoResult> {
    return this.roomService.getRoomInfoService(code);
  }

  // 방의 비밀번호를 변경하는 로직
  @Post(':code/password')
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  )
  @UseGuards(JwtGuard)
  async updateRoomPasswordController(
    @Req() req: Request,
    @Param('code') code: string,
    @Body() validate: UpdateRoomPasswordValidate,
  ) {
    const payload: Payload = (req as any).user;
    const dto: UpdateRoomPasswordDto = {
      new_password: validate.new_password ?? null,
      user_id: payload.user_id,
      code,
    };
    return this.roomService.updateRoomPasswordService(dto);
  }

  // 파일을 전송하는 로직
}
