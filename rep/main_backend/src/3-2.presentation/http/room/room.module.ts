import { Module } from '@nestjs/common';
import { RoomController } from './room.controller';
import { RoomService } from './room.service';
import { AuthModule } from '../auth/auth.module';
import { CreateRoomUsecase, UdpateRoomPasswordUsecase } from '@app/room/commands/usecase';
import {
  MakeArgonRoomPasswordHash,
  MakeRoomIdGenerator,
  MakeRoomRandomCodeGenerator,
} from './room.interface';
import {
  DeleteRoomDataToMysql,
  InsertRoomDataToMysql,
  UpdateRoomPasswordToMysql,
} from '@infra/db/mysql/room/room.outbound';
import {
  InsertRoomDataToRedis,
  UpdateRoomPasswordToRedis,
} from '@infra/cache/redis/room/room.outbound';
import { GetRoomInfoUsecase } from '@app/room/queries/usecase';
import { SelectRoomInfoDataFromRedis } from '@infra/cache/redis/room/room.inbound';
import {
  SelectRoomIdFromMysql,
  SelectUserInfoRoomFromMysql,
} from '@infra/db/mysql/room/room.inbound';

@Module({
  imports: [
    AuthModule, // jwt를 위한 import
  ],
  controllers: [RoomController],
  providers: [
    // room에서 사용하는 서비스
    RoomService,
    MakeArgonRoomPasswordHash,
    MakeRoomIdGenerator,
    MakeRoomRandomCodeGenerator,

    // usecase 관련
    {
      provide: CreateRoomUsecase,
      useFactory: (
        passwordHash: MakeArgonRoomPasswordHash,
        roomIdGenerator: MakeRoomIdGenerator,
        makeRoomCodeGenerator: MakeRoomRandomCodeGenerator,
        insertRoomDataToDb: InsertRoomDataToMysql,
        insertRoomDataToCache: InsertRoomDataToRedis,
        deleteRoomDataToDb: DeleteRoomDataToMysql,
      ) => {
        return new CreateRoomUsecase({
          passwordHash,
          roomIdGenerator,
          makeRoomCodeGenerator,
          insertRoomDataToDb,
          insertRoomDataToCache,
          deleteRoomDataToDb,
        });
      },
      inject: [
        MakeArgonRoomPasswordHash,
        MakeRoomIdGenerator,
        MakeRoomRandomCodeGenerator,
        InsertRoomDataToMysql,
        InsertRoomDataToRedis,
        DeleteRoomDataToMysql,
      ],
    },

    // 방의 정보를 가져오는 로직
    {
      provide: GetRoomInfoUsecase,
      useFactory: (
        selectRoomIdFromDb: SelectRoomIdFromMysql,
        selectRoomInfoFromCache: SelectRoomInfoDataFromRedis,
      ) => {
        return new GetRoomInfoUsecase({
          selectRoomIdFromDb,
          selectRoomInfoFromCache,
        });
      },
      inject: [SelectRoomIdFromMysql, SelectRoomInfoDataFromRedis],
    },

    // 방의 비밀번호를 바꾸는 로직
    {
      provide: UdpateRoomPasswordUsecase,
      useFactory: (
        selectUserInfoInRoomFromDb: SelectUserInfoRoomFromMysql,
        hashPassword: MakeArgonRoomPasswordHash,
        updateRoomPasswordToDb: UpdateRoomPasswordToMysql,
        updateRoomPasswordToCache: UpdateRoomPasswordToRedis,
      ) => {
        return new UdpateRoomPasswordUsecase({
          selectUserInfoInRoomFromDb,
          hashPassword,
          updateRoomPasswordToDb,
          updateRoomPasswordToCache,
        });
      },
      inject: [
        SelectUserInfoRoomFromMysql,
        MakeArgonRoomPasswordHash,
        UpdateRoomPasswordToMysql,
        UpdateRoomPasswordToRedis,
      ],
    },
  ],
})
export class RoomModule {}
