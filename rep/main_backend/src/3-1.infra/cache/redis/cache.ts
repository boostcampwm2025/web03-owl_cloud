import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from 'redis';
import {
  DeleteUserDataToRedis,
  InsertUserSessionDataToRedis,
} from './user/user.outbound';
import { REDIS_SERVER } from '../cache.constants';
import { SelectHsetDataFromRedis } from './user/user.inbound';
import { DeleteRoomDatasToRedis, InsertRoomDatasToRedis, InsertRoomDataToRedis } from './room/room.outbound';
import { SelectRoomInfoFromRedis } from './room/room.inbound';
import { CreateSfuTransportInfoToRedis, DeleteSfuTransportInfoToRedis,  } from "./sfu/sfu.outbound"
import { SelectSfuTransportDataFromRedis } from './sfu/sfu.inbound';


@Global()
@Module({
  providers: [
    ConfigService,
    {
      provide: REDIS_SERVER,
      useFactory: async (config: ConfigService) => {
        // redis connect
        const url: string = config.get<string>(
          'NODE_APP_REDIS_URL',
          'redis://localhost:6379',
        );
        const password: string = config.get<string>(
          'NODE_APP_REDIS_PASSWORD',
          'password',
        );

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
    SelectSfuTransportDataFromRedis // transport의 정보를 체크하기 위해서 필요한 로직
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
    SelectSfuTransportDataFromRedis
  ],
})
export class RedisModule {}
