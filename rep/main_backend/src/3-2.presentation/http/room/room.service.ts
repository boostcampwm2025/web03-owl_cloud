import { GetRoomInfoUsecase } from '@app/room/queries/usecase';
import { CreateRoomDto } from '@app/room/commands/dto';
import { CreateRoomUsecase } from '@app/room/commands/usecase';
import { HttpException, Injectable } from '@nestjs/common';
import { GetRoomInfoResult } from '@app/room/queries/dto';

@Injectable()
export class RoomService {
  constructor(
    private readonly createRoomUsecase: CreateRoomUsecase<any, any>,
    private readonly getRoomInfoUsecase: GetRoomInfoUsecase<any, any>,
  ) {}

  // 방을 생성하기 위한 서비스
  async createRoomService(dto: CreateRoomDto) {
    try {
      const result = await this.createRoomUsecase.execute(dto);
      return result;
    } catch (err) {
      throw new HttpException(
        {
          message: err.message || err,
          status: err.status || 500,
        },
        err.status || 500,
        {
          cause: err,
        },
      );
    }
  }

  // 방의 정보를 가져오는 로직
  async getRoomInfoService(code: string): Promise<GetRoomInfoResult> {
    try {
      const result: GetRoomInfoResult = await this.getRoomInfoUsecase.execute(code);

      return result;
    } catch (err) {
      throw new HttpException(
        {
          message: err.message || err,
          status: err.status || 500,
        },
        err.status || 500,
        {
          cause: err,
        },
      );
    }
  }
}
