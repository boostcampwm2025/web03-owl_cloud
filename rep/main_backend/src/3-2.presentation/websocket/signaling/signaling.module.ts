import { ConnectRoomUsecase, DisconnectRoomUsecase } from "@app/room/commands/usecase";
import { Module } from "@nestjs/common";
import { SelectRoomDataFromMysql } from "@infra/db/mysql/room/room.inbound";
import { CompareRoomArgonHash } from "./signaling.interface";
import { SelectRoomInfoFromRedis } from "@infra/cache/redis/room/room.inbound";
import { DeleteHardRoomParticipantInfoDataToMysql, InsertRoomParticipantInfoDataToMysql, UpdateRoomParticipantInfoToMysql } from "@infra/db/mysql/room/room.outbound";
import { DeleteRoomDatasToRedis, InsertRoomDatasToRedis } from "@infra/cache/redis/room/room.outbound";
import { SignalingWebsocketService } from "./signaling.service";
import { AuthWebsocketModule } from "../auth/auth.module";
import { SignalingWebsocketGateway } from "./signaling.gateway";
import { SfuModule } from "@present/webrtc/sfu/sfu.module";


@Module({
  imports : [
    AuthWebsocketModule,
    SfuModule
  ],  
  providers : [
    // sfu 자체적인 모듈
    SignalingWebsocketGateway,
    SignalingWebsocketService,
    CompareRoomArgonHash,

    // usecase 모아두기

    // 방에 연결하기 위한 usecase
    {
      provide : ConnectRoomUsecase,
      useFactory : (
        selectRoomDataFromDb : SelectRoomDataFromMysql,
        compareRoomPasswordHash : CompareRoomArgonHash,
        selectRoomInfoDataFromCache : SelectRoomInfoFromRedis,
        insertRoomParticipantInfoDataToDb : InsertRoomParticipantInfoDataToMysql,
        insertRoomDatasToCache : InsertRoomDatasToRedis,
        deleteRoomParticipantInfoDataToDb : DeleteHardRoomParticipantInfoDataToMysql
      ) => {  
        return new ConnectRoomUsecase({
          selectRoomDataFromDb, compareRoomPasswordHash, selectRoomInfoDataFromCache, insertRoomParticipantInfoDataToDb, insertRoomDatasToCache, deleteRoomParticipantInfoDataToDb
        })
      },
      inject : [
        SelectRoomDataFromMysql,
        CompareRoomArgonHash,
        SelectRoomInfoFromRedis,
        InsertRoomParticipantInfoDataToMysql,
        InsertRoomDatasToRedis,
        DeleteHardRoomParticipantInfoDataToMysql
      ]
    },

    // 방의 연결을 끊기 위한 usecase
    {
      provide : DisconnectRoomUsecase,
      useFactory : (
        updateRoomParticipantInfoToDb : UpdateRoomParticipantInfoToMysql,
        deleteRoomDataToCache : DeleteRoomDatasToRedis
      ) => {
        return new DisconnectRoomUsecase({
          updateRoomParticipantInfoToDb, deleteRoomDataToCache
        })
      },
      inject : [
        UpdateRoomParticipantInfoToMysql,
        DeleteRoomDatasToRedis
      ]
    }
  ]
})
export class SignalingWebsocketModule {};