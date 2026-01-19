import {
  ConnectRoomUsecase,
  DisconnectRoomUsecase,
  OpenToolUsecase,
} from '@app/room/commands/usecase';
import { Module } from '@nestjs/common';
import { SelectRoomDataFromMysql } from '@infra/db/mysql/room/room.inbound';
import { CompareRoomArgonHash, MakeIssueToolTicket } from './signaling.interface';
import {
  CheckRoomUserFromRedis,
  CheckUserPayloadFromRedis,
  SelectRoomInfoFromRedis,
  SelectRoomMemberInfosFromRedis,
} from '@infra/cache/redis/room/room.inbound';
import {
  DeleteHardRoomParticipantInfoDataToMysql,
  InsertRoomParticipantInfoDataToMysql,
  UpdateRoomParticipantInfoToMysql,
} from '@infra/db/mysql/room/room.outbound';
import {
  DeleteMainProducerFromRedis,
  DeleteRoomDatasToRedis,
  InsertRoomDatasToRedis,
  InsertToolTicketToRedis,
} from '@infra/cache/redis/room/room.outbound';
import { SignalingWebsocketService } from './signaling.service';
import { AuthWebsocketModule } from '../auth/auth.module';
import { SignalingWebsocketGateway } from './signaling.gateway';
import { SfuModule } from '@present/webrtc/sfu/sfu.module';
import {
  ConnectToolUsecase,
  DisconnectToolUsecase,
  GetRoomMembersUsecase,
} from '@app/room/queries/usecase';
import { ConfigService } from '@nestjs/config';
import { TOOL_LEFT_TOPIC_NAME } from './signaling.validate';
import { EVENT_STREAM_NAME } from '@infra/event-stream/event-stream.constants';
import { KafkaService } from '@infra/event-stream/kafka/event-stream-service';

@Module({
  imports: [AuthWebsocketModule, SfuModule],
  providers: [
    // sfu 자체적인 모듈
    ConfigService,
    SignalingWebsocketGateway,
    SignalingWebsocketService,
    CompareRoomArgonHash,
    {
      provide: TOOL_LEFT_TOPIC_NAME,
      useValue: EVENT_STREAM_NAME.TOOL_LEFT,
    },
    {
      provide: MakeIssueToolTicket,
      useFactory: (config: ConfigService) => {
        return new MakeIssueToolTicket(config);
      },
      inject: [ConfigService],
    },

    // usecase 모아두기

    // 방에 연결하기 위한 usecase
    {
      provide: ConnectRoomUsecase,
      useFactory: (
        selectRoomDataFromDb: SelectRoomDataFromMysql,
        compareRoomPasswordHash: CompareRoomArgonHash,
        selectRoomInfoDataFromCache: SelectRoomInfoFromRedis,
        insertRoomParticipantInfoDataToDb: InsertRoomParticipantInfoDataToMysql,
        insertRoomDatasToCache: InsertRoomDatasToRedis,
        deleteRoomParticipantInfoDataToDb: DeleteHardRoomParticipantInfoDataToMysql,
      ) => {
        return new ConnectRoomUsecase({
          selectRoomDataFromDb,
          compareRoomPasswordHash,
          selectRoomInfoDataFromCache,
          insertRoomParticipantInfoDataToDb,
          insertRoomDatasToCache,
          deleteRoomParticipantInfoDataToDb,
        });
      },
      inject: [
        SelectRoomDataFromMysql,
        CompareRoomArgonHash,
        SelectRoomInfoFromRedis,
        InsertRoomParticipantInfoDataToMysql,
        InsertRoomDatasToRedis,
        DeleteHardRoomParticipantInfoDataToMysql,
      ],
    },

    // 방의 연결을 끊기 위한 usecase
    {
      provide: DisconnectRoomUsecase,
      useFactory: (
        updateRoomParticipantInfoToDb: UpdateRoomParticipantInfoToMysql,
        deleteRoomDataToCache: DeleteRoomDatasToRedis,
      ) => {
        return new DisconnectRoomUsecase({
          updateRoomParticipantInfoToDb,
          deleteRoomDataToCache,
        });
      },
      inject: [UpdateRoomParticipantInfoToMysql, DeleteRoomDatasToRedis],
    },

    // 방에 멤버들의 정보를 보내주기 위한 usecase
    {
      provide: GetRoomMembersUsecase,
      useFactory: (selectRoomMemberInfosFromCache: SelectRoomMemberInfosFromRedis) => {
        return new GetRoomMembersUsecase({ selectRoomMemberInfosFromCache });
      },
      inject: [SelectRoomMemberInfosFromRedis],
    },

    // tool을 사용하기 위해서 검증용 jwk 요청 usecase
    {
      provide: OpenToolUsecase,
      useFactory: (
        checkUserPaylodFromCache: CheckUserPayloadFromRedis,
        makeToolTicket: MakeIssueToolTicket,
        insertToolTicketToCache: InsertToolTicketToRedis,
      ) => {
        return new OpenToolUsecase({
          checkUserPaylodFromCache,
          makeToolTicket,
          insertToolTicketToCache,
        });
      },
      inject: [CheckUserPayloadFromRedis, MakeIssueToolTicket, InsertToolTicketToRedis],
    },

    // tool에 connecting 하기 위한 usecase
    {
      provide: ConnectToolUsecase,
      useFactory: (
        checkUserPaylodFromCache: CheckRoomUserFromRedis,
        makeToolTicket: MakeIssueToolTicket,
      ) => {
        return new ConnectToolUsecase({
          checkUserPaylodFromCache,
          makeToolTicket,
        });
      },
      inject: [CheckRoomUserFromRedis, MakeIssueToolTicket],
    },

    // tool을 disconnect 하기 위한 usecase
    {
      provide: DisconnectToolUsecase,
      useFactory: (
        stream: KafkaService,
        checkUserPaylodFromCache: CheckRoomUserFromRedis,
        toolLeftTopicName: string,
        deleteMainContentsToCache: DeleteMainProducerFromRedis,
      ) => {
        return new DisconnectToolUsecase(stream, {
          checkUserPaylodFromCache,
          toolLeftTopicName,
          deleteMainContentsToCache,
        });
      },
      inject: [
        KafkaService,
        CheckRoomUserFromRedis,
        TOOL_LEFT_TOPIC_NAME,
        DeleteMainProducerFromRedis,
      ],
    },
  ],
})
export class SignalingWebsocketModule {}
