import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { REDIS_SERVER } from '../cache.constants';
import { createClient } from 'redis';

@Global()
@Module({
  providers: [
    ConfigService,
    {
      provide: REDIS_SERVER,
      useFactory: async (config: ConfigService) => {
        const url: string = config.get<string>('NODE_APP_REDIS_URL', 'redis://localhost:6379');
        const password: string = config.get<string>('NODE_APP_REDIS_PASSWORD', 'password');

        const client = createClient({
          url,
          password,
        });

        client.on('error', (err) => {
          console.error(`redis를 연결하는데 에러가 발생했습니다: ${err}`);
        });

        // client 연결
        await client.connect();

        return client;
      },
      inject: [ConfigService],
    },
  ],
  exports: [REDIS_SERVER],
})
export class RedisCacheModule {}
