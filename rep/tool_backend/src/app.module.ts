import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './health/health.module';
import { RedisCacheModule } from '@infra/cache/redis/cache';
import { RedisChannelModule } from '@infra/channel/redis/channel';
import { MysqlModule } from '@infra/db/mysql/db';
import CookieParser from "cookie-parser";
import { KafkaModule } from '@infra/event-stream/kafka/event-stream';
import { GuardModule } from './guards/guard.module';
import { WhiteboardWebsocketGateway } from './whiteboard/whiteboard.gateway';


@Module({
  imports: [
    ConfigModule.forRoot({}),

    // infra 모듈
    RedisCacheModule,
    RedisChannelModule,
    MysqlModule,
    KafkaModule, // kafka용 모듈

    // 추가 모듈
    HealthModule,
    GuardModule,
    WhiteboardWebsocketGateway
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
    .apply(CookieParser())
    .forRoutes({ path : "*", method : RequestMethod.ALL })
  }
}
