import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from 'redis';
import {
  DeleteUserDataToRedis,
  InsertUserSessionDataToRedis,
} from './user/user.outbound';
import { REDIS_SERVER } from '../cache.constants';
import { SelectHsetDataFromRedis } from './user/user.inbound';
import { InsertCardItemAssetInitDataToRedis, UpdateCardItemAssetDataToRedis, UpdateCardItemAssetEntityToRedis } from './card/card.outbound';
import { SelectCardItemAssetFromRedis } from './card/card.inbound';

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
    InsertCardItemAssetInitDataToRedis,
    SelectCardItemAssetFromRedis,
    UpdateCardItemAssetDataToRedis,
    UpdateCardItemAssetEntityToRedis
  ],
  exports: [
    REDIS_SERVER,
    InsertUserSessionDataToRedis,
    SelectHsetDataFromRedis,
    DeleteUserDataToRedis,
    InsertCardItemAssetInitDataToRedis,
    SelectCardItemAssetFromRedis,
    UpdateCardItemAssetDataToRedis,
    UpdateCardItemAssetEntityToRedis
  ],
})
export class RedisModule {}
