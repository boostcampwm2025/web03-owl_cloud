import { Global, Module } from '@nestjs/common';
import { REDIS_CHANNEL_PUB, REDIS_CHANNEL_SUB } from '../channel.constants';
import { ConfigService } from '@nestjs/config';
import { createClient } from 'redis';
import { RedisSseBrokerService } from './channel.service';

@Global()
@Module({
  providers: [
    // 기본으로 제공하는 config 서비스
    ConfigService,

    // publisher
    {
      provide: REDIS_CHANNEL_PUB,
      useFactory: async (config: ConfigService) => {
        // client 연결
        const url: string = config.get<string>('NODE_APP_REDIS_URL', 'redis://localhost:6379');
        const client = createClient({ url });

        // 나중에 log로 대체 되어야 한다.
        client.on('error', (e) => console.error(`[redis pub error]`, e));
        await client.connect();
        return client;
      },
      inject: [ConfigService],
    },

    // subscriber
    {
      provide: REDIS_CHANNEL_SUB,
      useFactory: async (config: ConfigService) => {
        const url: string = config.get<string>('NODE_APP_REDIS_URL', 'redis://localhost:6379');
        const client = createClient({ url });

        client.on('error', (e) => console.error(`[redis sub error]`, e));
        await client.connect();
        return client;
      },
      inject: [ConfigService],
    },

    // 우리가 만든 함수들 모아놓는 장소
    RedisSseBrokerService,
  ],
  exports: [REDIS_CHANNEL_PUB, REDIS_CHANNEL_SUB, RedisSseBrokerService],
})
export class RedisChannelModule {}
