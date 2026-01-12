import { Module } from "@nestjs/common";
import { SfuService } from "./sfu.service";
import { MediasoupRouterFactory } from "./sfu.interface";
import { CreateRouterUsecase, CreateTransportUsecase } from "@app/sfu/commands/usecase";
import { RoomCreateLockRepo, RoomRouterRepository, TransportRepository } from "@infra/memory/sfu";
import { RoomCreateLockPort, RoomRouterRepositoryPort, RouterFactoryPort, TransportFactoryPort, TransportRepositoryPort } from "@app/sfu/ports";
import { CreateSfuTransportInfoToRedis, DeleteSfuTransportInfoToRedis } from "@infra/cache/redis/sfu/sfu.outbound";
import { MediasoupTransportFactory } from "@infra/media/mediasoup/sfu/sfu.outbound";
import { ConnectTransportUsecase } from "@app/sfu/queries/usecase";
import { SelectSfuTransportDataFromRedis } from "@infra/cache/redis/sfu/sfu.inbound";


@Module({
  providers : [
    SfuService,

    // 메모리 사용을 위한 의존성 주입
    MediasoupRouterFactory,

    // usecase들
    // router를 생성하기 위한 usecase
    {
      provide : CreateRouterUsecase,
      useFactory : (
        roomRepo : RoomRouterRepositoryPort,
        roomCreateLockRepo : RoomCreateLockPort,
        routerFactory : RouterFactoryPort
      ) => {
        return new CreateRouterUsecase(
          roomRepo, roomCreateLockRepo, routerFactory
        )
      },
      inject : [
        RoomRouterRepository,
        RoomCreateLockRepo,
        MediasoupRouterFactory
      ]
    },

    // transport 생성 usecase
    {
      provide : CreateTransportUsecase,
      useFactory : (
        roomRepo : RoomRouterRepositoryPort,
        transportRepo: TransportRepositoryPort,
        transportFactory: TransportFactoryPort,
        insertTranportInfoToRedis : CreateSfuTransportInfoToRedis,
        deleteTransportInfoToRedis : DeleteSfuTransportInfoToRedis,
      ) => {
        return new CreateTransportUsecase(
          roomRepo,
          transportRepo,
          transportFactory,
          insertTranportInfoToRedis,
          deleteTransportInfoToRedis
        )
      },
      inject : [
        RoomRouterRepository,
        TransportRepository,
        MediasoupTransportFactory,
        CreateSfuTransportInfoToRedis,
        DeleteSfuTransportInfoToRedis,
      ]
    },

    // transport 연결 usecase
    {
      provide : ConnectTransportUsecase,
      useFactory  : (
        transportRepo: TransportRepositoryPort,
        selectSfuTransportInfoFromRedis : SelectSfuTransportDataFromRedis,
      ) => {
        return new ConnectTransportUsecase(
          transportRepo, selectSfuTransportInfoFromRedis
        )
      },
      inject : [
        TransportRepository,
        SelectSfuTransportDataFromRedis
      ]
    }

  ],
  exports : [
    SfuService,
  ]
})
export class SfuModule {};