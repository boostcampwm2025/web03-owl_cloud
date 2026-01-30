import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './health/health.module';
import { RedisCacheModule } from '@infra/cache/redis/cache';
import { RedisChannelModule } from '@infra/channel/redis/channel';
import { MysqlModule } from '@infra/db/mysql/db';
import CookieParser from 'cookie-parser';
import { KafkaModule } from '@infra/event-stream/kafka/event-stream';
import { GuardModule } from './guards/guard.module';
import { WhiteboardModule } from './whiteboard/whiteboard.module';
import { CodeeditorModule } from './codeeditor/codeeditor.module';
import { CodeeditorWebsocketModule } from './infra/websocket/codeeditor/codeeditor.module';
import { WhiteboardWebsocketModule } from './infra/websocket/whiteboard/whiteboard.module';
import { MemoryModule } from './infra/memory/memory.module';

@Module({
  imports: [
    ConfigModule.forRoot({}),

    // infra 모듈
    RedisCacheModule,
    RedisChannelModule,
    MysqlModule,
    KafkaModule, // kafka용 모듈
    MemoryModule, // 내장 ram을 사용하기 위한 모듈

    // 추가 모듈
    HealthModule,
    GuardModule,
    WhiteboardModule, // whiteboard
    CodeeditorModule, // codeeditor
    WhiteboardWebsocketModule, // whiteboard용 websocket
    CodeeditorWebsocketModule, // codeeditor용 websocket
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CookieParser()).forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
