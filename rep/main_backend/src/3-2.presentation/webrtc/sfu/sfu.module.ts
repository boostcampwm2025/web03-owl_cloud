import { Module } from '@nestjs/common';
import { SfuService } from './sfu.service';
import { MediasoupRouterFactory } from './sfu.interface';
import {
  CreateConsumersUsecase,
  CreateConsumerUsecase,
  CreateProduceUsecase,
  CreateRouterUsecase,
  CreateTransportUsecase,
  DisconnectUserUsecase,
} from '@app/sfu/commands/usecase';
import {
  ConsumerRepository,
  ProducerRepository,
  RoomCreateLockRepo,
  RoomRouterRepository,
  TransportRepository,
} from '@infra/memory/sfu';
import {
  ConsumerRepositoryPort,
  ProducerRepositoryPort,
  RoomCreateLockPort,
  RoomRouterRepositoryPort,
  RouterFactoryPort,
  TransportFactoryPort,
  TransportRepositoryPort,
} from '@app/sfu/ports';
import {
  CreateSfuTransportInfoToRedis,
  DeleteConsumerDataToRedis,
  DeleteMainProducerDataToRedis,
  DeleteSfuTransportInfoToRedis,
  DeleteUserProducerDataToRedis,
  InsertConsumerDatasToRedis,
  InsertConsumerDataToRedis,
  InsertMainProducerDataToRedis,
  InsertUserProducerDataToRedis,
} from '@infra/cache/redis/sfu/sfu.outbound';
import { MediasoupTransportFactory } from '@infra/media/mediasoup/sfu/sfu.outbound';
import {
  ConnectTransportUsecase,
  PauseConsumerUsecase,
  PauseConsumesUsecase,
  ResumeConsumersUsecase,
  ResumeConsumerUsecase,
} from '@app/sfu/queries/usecase';
import {
  SelectConsumerInfoFromRedis,
  SelectConsumerInfosFromRedis,
  SelectMainProducerDataFromRedis,
  SelectSfuTransportDataFromRedis,
  SelectUserProducerDataFromRedis,
  SelectUserTransportFromRedis,
} from '@infra/cache/redis/sfu/sfu.inbound';

@Module({
  providers: [
    SfuService,

    // 메모리 사용을 위한 의존성 주입
    MediasoupRouterFactory,

    // usecase들
    // router를 생성하기 위한 usecase
    {
      provide: CreateRouterUsecase,
      useFactory: (
        roomRepo: RoomRouterRepositoryPort,
        roomCreateLockRepo: RoomCreateLockPort,
        routerFactory: RouterFactoryPort,
      ) => {
        return new CreateRouterUsecase(roomRepo, roomCreateLockRepo, routerFactory);
      },
      inject: [RoomRouterRepository, RoomCreateLockRepo, MediasoupRouterFactory],
    },

    // transport 생성 usecase
    {
      provide: CreateTransportUsecase,
      useFactory: (
        roomRepo: RoomRouterRepositoryPort,
        transportRepo: TransportRepositoryPort,
        transportFactory: TransportFactoryPort,
        insertTranportInfoToRedis: CreateSfuTransportInfoToRedis,
        deleteTransportInfoToRedis: DeleteSfuTransportInfoToRedis,
      ) => {
        return new CreateTransportUsecase(
          roomRepo,
          transportRepo,
          transportFactory,
          insertTranportInfoToRedis,
          deleteTransportInfoToRedis,
        );
      },
      inject: [
        RoomRouterRepository,
        TransportRepository,
        MediasoupTransportFactory,
        CreateSfuTransportInfoToRedis,
        DeleteSfuTransportInfoToRedis,
      ],
    },

    // transport 연결 usecase
    {
      provide: ConnectTransportUsecase,
      useFactory: (
        transportRepo: TransportRepositoryPort,
        selectSfuTransportInfoFromRedis: SelectSfuTransportDataFromRedis,
      ) => {
        return new ConnectTransportUsecase(transportRepo, selectSfuTransportInfoFromRedis);
      },
      inject: [TransportRepository, SelectSfuTransportDataFromRedis],
    },

    // 유저가 disconnect 하기 위한 usecase
    {
      provide: DisconnectUserUsecase,
      useFactory: (
        transportRepo: TransportRepositoryPort,
        selectUserTransportFromCache: SelectUserTransportFromRedis,
      ) => {
        return new DisconnectUserUsecase(transportRepo, {
          selectUserTransportFromCache,
        });
      },
      inject: [TransportRepository, SelectUserTransportFromRedis],
    },

    // producer 생성 usecase
    {
      provide: CreateProduceUsecase,
      useFactory: (
        produceRepo: ProducerRepositoryPort,
        transportRepo: TransportRepositoryPort,
        selectTransportDataFromCache: SelectSfuTransportDataFromRedis,
        selectUserProducerDataFromCache: SelectUserProducerDataFromRedis,
        selectMainProducerDataFromCache: SelectMainProducerDataFromRedis,
        insertUserProducerDataToCache: InsertUserProducerDataToRedis,
        insertMainProducerDataToCache: InsertMainProducerDataToRedis,
        deleteUserProducerDataToCache: DeleteUserProducerDataToRedis,
        deleteMainProducerDataToCache: DeleteMainProducerDataToRedis,
      ) => {
        return new CreateProduceUsecase(produceRepo, transportRepo, {
          selectTransportDataFromCache,
          selectUserProducerDataFromCache,
          selectMainProducerDataFromCache,
          insertUserProducerDataToCache,
          insertMainProducerDataToCache,
          deleteUserProducerDataToCache,
          deleteMainProducerDataToCache,
        });
      },
      inject: [
        ProducerRepository,
        TransportRepository,
        SelectSfuTransportDataFromRedis,
        SelectUserProducerDataFromRedis,
        SelectMainProducerDataFromRedis,
        InsertUserProducerDataToRedis,
        InsertMainProducerDataToRedis,
        DeleteUserProducerDataToRedis,
        DeleteMainProducerDataToRedis,
      ],
    },

    // consumer 생성 usecase
    {
      provide: CreateConsumerUsecase,
      useFactory: (
        routerRepo: RoomRouterRepositoryPort,
        transportRepo: TransportRepositoryPort,
        consumerRepo: ConsumerRepositoryPort,
        selectTransportDataFromCache: SelectSfuTransportDataFromRedis,
        insertConsumerDataToCache: InsertConsumerDataToRedis,
        deleteConsumerDataToCache: DeleteConsumerDataToRedis,
      ) => {
        return new CreateConsumerUsecase(routerRepo, transportRepo, consumerRepo, {
          selectTransportDataFromCache,
          insertConsumerDataToCache,
          deleteConsumerDataToCache,
        });
      },
      inject: [
        RoomRouterRepository,
        TransportRepository,
        ConsumerRepository,
        SelectSfuTransportDataFromRedis,
        InsertConsumerDataToRedis,
        DeleteConsumerDataToRedis,
      ],
    },

    // consumer를 재개하는 usecase
    {
      provide: ResumeConsumerUsecase,
      useFactory: (
        consumerRepo: ConsumerRepositoryPort,
        selectConsumerInfoFromCache: SelectConsumerInfoFromRedis,
      ) => {
        return new ResumeConsumerUsecase(consumerRepo, { selectConsumerInfoFromCache });
      },
      inject: [ConsumerRepository, SelectConsumerInfoFromRedis],
    },

    // consumer를 멈추는 usecase
    {
      provide: PauseConsumerUsecase,
      useFactory: (
        consumerRepo: ConsumerRepositoryPort,
        selectConsumerInfoFromCache: SelectConsumerInfoFromRedis,
      ) => {
        return new PauseConsumerUsecase(consumerRepo, { selectConsumerInfoFromCache });
      },
      inject: [ConsumerRepository, SelectConsumerInfoFromRedis],
    },

    // 여러개의 consumer들을 만드는 usecase
    {
      provide: CreateConsumersUsecase,
      useFactory: (
        routerRepo: RoomRouterRepositoryPort,
        transportRepo: TransportRepositoryPort,
        consumerRepo: ConsumerRepositoryPort,
        selectTransportDataFromCache: SelectSfuTransportDataFromRedis,
        insertConsumerDatasToCache: InsertConsumerDatasToRedis,
        deleteConsumerDataToCache: DeleteConsumerDataToRedis,
      ) => {
        return new CreateConsumersUsecase(routerRepo, transportRepo, consumerRepo, {
          selectTransportDataFromCache,
          insertConsumerDatasToCache,
          deleteConsumerDataToCache,
        });
      },
      inject: [
        RoomRouterRepository,
        TransportRepository,
        ConsumerRepository,
        SelectSfuTransportDataFromRedis,
        InsertConsumerDatasToRedis,
        DeleteConsumerDataToRedis,
      ],
    },

    // 여러개의 consumers를 재개 하는 usecase
    {
      provide: ResumeConsumersUsecase,
      useFactory: (
        consumerRepo: ConsumerRepositoryPort,
        selectConsumerInfosFromCache: SelectConsumerInfosFromRedis,
      ) => {
        return new ResumeConsumersUsecase(consumerRepo, { selectConsumerInfosFromCache });
      },
      inject: [ConsumerRepository, SelectConsumerInfosFromRedis],
    },

    // 여러개의 consumers를 멈추는 usecase
    {
      provide: PauseConsumesUsecase,
      useFactory: (
        consumerRepo: ConsumerRepositoryPort,
        selectConsumerInfosFromCache: SelectConsumerInfosFromRedis,
      ) => {
        return new PauseConsumesUsecase(consumerRepo, { selectConsumerInfosFromCache });
      },
      inject: [ConsumerRepository, SelectConsumerInfosFromRedis],
    },
  ],
  exports: [SfuService],
})
export class SfuModule {}
