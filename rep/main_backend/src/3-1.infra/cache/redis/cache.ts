import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from 'redis';
import { DeleteUserDataToRedis, InsertUserSessionDataToRedis } from './user/user.outbound';
import { REDIS_SERVER } from '../cache.constants';
import { SelectHsetDataFromRedis } from './user/user.inbound';
import {
  DeleteMainProducerFromRedis,
  DeleteRoomDatasToRedis,
  InsertFileInfoToRedis,
  InsertRoomDatasToRedis,
  InsertRoomDataToRedis,
  InsertToolTicketToRedis,
  UpdateFileInfoToRedis,
  UpdateRoomPasswordToRedis,
} from './room/room.outbound';
import {
  CheckRoomMemberFromRedis,
  CheckRoomUserFromRedis,
  CheckToolTicketFromRedis,
  CheckUserAndSelectFileInfoFromRedis,
  CheckUserAndSelectPrevFileInfoFromRedis,
  CheckUserPayloadFromRedis,
  SelectRoomInfoDataFromRedis,
  SelectRoomInfoFromRedis,
  SelectRoomMemberInfosFromRedis,
} from './room/room.inbound';
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
  UpdateProducerStatusToRedis,
} from './sfu/sfu.outbound';
import {
  SelectConsumerInfoFromRedis,
  SelectConsumerInfosFromRedis,
  SelectMainProducerDataFromRedis,
  SelectRoomProducerDataFromRedis,
  SelectSfuTransportDataFromRedis,
  SelectUserProducerDataFromRedis,
  SelectUserProducerInfoDataFromRedis,
  SelectUserTransportFromRedis,
} from './sfu/sfu.inbound';

@Global()
@Module({
  providers: [
    ConfigService,
    {
      provide: REDIS_SERVER,
      useFactory: async (config: ConfigService) => {
        // redis connect
        const url: string = config.get<string>('NODE_APP_REDIS_URL', 'redis://localhost:6379');
        const password: string = config.get<string>('NODE_APP_REDIS_PASSWORD', 'password');

        const client = createClient({
          url,
          password,
        });

        // 나중에 logger로 처리
        client.on('error', (err) => {
          console.error(`redis를 연결하는데 에러가 발생했습니다: ${err}`);
        });

        await client.connect();

        return client;
      },
      inject: [ConfigService],
    },

    InsertUserSessionDataToRedis,
    SelectHsetDataFromRedis,
    DeleteUserDataToRedis,
    InsertRoomDataToRedis, // room data를 생성할때 사용
    SelectRoomInfoFromRedis, // roominfo 정보를 찾을때 사용
    InsertRoomDatasToRedis, // room data들을 저장할때 사용
    DeleteRoomDatasToRedis, // room정보들을 삭제하기 위해 사용
    CreateSfuTransportInfoToRedis, // transport들의 정보를 저장하기 위한 로직
    DeleteSfuTransportInfoToRedis, // transport가 만약 에러가 발생하거나 삭제될때 발동하는 로직
    SelectSfuTransportDataFromRedis, // transport의 정보를 체크하기 위해서 필요한 로직
    SelectUserProducerDataFromRedis, // user에 producer 정보를 확인하기 위해 필요한 로직
    SelectMainProducerDataFromRedis, // main에 producer 정보를 확인하기 위해 필요한 로직
    InsertUserProducerDataToRedis, // user producer에 정보를 저장
    InsertMainProducerDataToRedis, // main producer 정보를 저장한다.
    DeleteUserProducerDataToRedis, // user producer를 삭제한다.
    DeleteMainProducerDataToRedis, // main producer를 삭제한다.
    InsertConsumerDataToRedis, // consumer 정보를 저장한다.
    DeleteConsumerDataToRedis, // consumer 정보를 삭제한다.
    SelectUserTransportFromRedis, // transport에서 유저 정보에 해당하는 데이터가 있는 경우
    SelectConsumerInfoFromRedis, // consumer 정보가 제대로 있는지 확인
    SelectRoomMemberInfosFromRedis, // 방에 있는 유저들의 정보를 보낸다.
    InsertConsumerDatasToRedis,
    SelectConsumerInfosFromRedis, // 해당 consumer_ids들의 정보를 보낸다.
    CheckUserPayloadFromRedis, // 현재 유저가 보낸 요청이 맞는지 확인
    InsertToolTicketToRedis, // tool에 대해서 redis에 정보를 저장한다.
    CheckToolTicketFromRedis, // ticket을 이용해서 검증 맞는지
    CheckRoomUserFromRedis, // room에 유저가 있고 해당 producer가 메인이 맞는지 확인
    DeleteMainProducerFromRedis, // 해당 room에 있는 main_producer를 삭제
    SelectRoomInfoDataFromRedis, // 해당 방에 정보를 가져오는 redis
    UpdateProducerStatusToRedis, // prodcuer에서 status가 변경 될때 사용하는 redis -> 정합성이 좀 부족하다 고민 해야 함
    SelectUserProducerInfoDataFromRedis, // user에 producer 관련 데이터를 가져와야 한다.
    SelectRoomProducerDataFromRedis, // producer에 대한 데이터를 가져오는 로직 구현
    CheckUserAndSelectPrevFileInfoFromRedis, // 방에 유저가 있는지 그리고 저장중인 다른 파일이 있는지 확인
    InsertFileInfoToRedis, // 파일의 정보를 redis에 저장하는 로직
    CheckUserAndSelectFileInfoFromRedis, // 이 유저가 방에 존재하는지 그리고 파일이 제대로 업로드가 됐는지 확인하는 로직
    UpdateFileInfoToRedis, // 방에 파일의 상태를 변경
    CheckRoomMemberFromRedis, // 유저가 방에 있고 다운 받을수 있는지 확인하는 로직
    UpdateRoomPasswordToRedis, // 호스트가 redis에서 방의 비밀번호를 바꾸는 로직입니다.
  ],
  exports: [
    REDIS_SERVER,
    InsertUserSessionDataToRedis,
    SelectHsetDataFromRedis,
    DeleteUserDataToRedis,
    InsertRoomDataToRedis,
    SelectRoomInfoFromRedis,
    InsertRoomDatasToRedis,
    DeleteRoomDatasToRedis,
    CreateSfuTransportInfoToRedis,
    DeleteSfuTransportInfoToRedis,
    SelectSfuTransportDataFromRedis,
    SelectUserProducerDataFromRedis,
    SelectMainProducerDataFromRedis,
    InsertUserProducerDataToRedis,
    InsertMainProducerDataToRedis,
    DeleteUserProducerDataToRedis,
    DeleteMainProducerDataToRedis,
    InsertConsumerDataToRedis,
    DeleteConsumerDataToRedis,
    SelectUserTransportFromRedis,
    SelectConsumerInfoFromRedis,
    SelectRoomMemberInfosFromRedis,
    InsertConsumerDatasToRedis,
    SelectConsumerInfosFromRedis,
    CheckUserPayloadFromRedis,
    InsertToolTicketToRedis,
    CheckToolTicketFromRedis,
    CheckRoomUserFromRedis,
    DeleteMainProducerFromRedis,
    SelectRoomInfoDataFromRedis,
    UpdateProducerStatusToRedis,
    SelectUserProducerInfoDataFromRedis,
    SelectRoomProducerDataFromRedis,
    CheckUserAndSelectPrevFileInfoFromRedis,
    InsertFileInfoToRedis,
    CheckUserAndSelectFileInfoFromRedis,
    UpdateFileInfoToRedis,
    CheckRoomMemberFromRedis,
    UpdateRoomPasswordToRedis,
  ],
})
export class RedisModule {}
