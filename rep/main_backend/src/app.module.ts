import 'dotenv/config';
import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import CookieParser from 'cookie-parser';
import { MysqlModule } from '@infra/db/mysql/db';
import { SettingModule } from '@present/http/setting/setting.module';
import { AuthModule } from '@present/http/auth/auth.module';
import { RedisModule } from '@infra/cache/redis/cache';
import { JwtModule } from '@infra/auth/jwt/jwt.module';
import { S3DiskModule } from '@infra/disk/s3/disk';
import { RedisChannelModule } from '@infra/channel/redis/channel';
import { RoomModule } from '@present/http/room/room.module';
import { SignalingWebsocketModule } from '@present/websocket/signaling/signaling.module';
import { MediaModule } from '@infra/media/media.module';
import { SfuModule } from '@present/webrtc/sfu/sfu.module';
import { MemoryModule } from '@infra/memory/memory.module';
import { KafkaModule } from '@infra/event-stream/kafka/event-stream';
import { ToolConsumerModule } from '@present/tcp/tool/tool.module';
import { SignalingBroadcasterModule } from './3-1.infra/websocket/signaling/signaling.module';

@Module({
  imports: [
    // 사용 모듈
    ConfigModule.forRoot({}), // env 파일을 사용하기 위해서 설치한 모듈 global로 설정하여 import 필요없게 했음

    // infra
    MysqlModule, // mysql을 사용하기 위한 모듈
    RedisModule, // redis를 사용하기 위한 모듈
    JwtModule, // jwt를 사용하기 위한 모듈
    S3DiskModule, // s3를 사용하기 위한 모듈
    RedisChannelModule, // redis를 활용한 pub sub을 이용하기 위한 모듈
    MediaModule, // media를 다루기 위한 모듈
    MemoryModule, // in-memory를 사용하기 위해 필요한 모듈
    KafkaModule, // kafka를 사용하기 위한 모듈

    // 우리가 집적 만든 모듈
    SettingModule, // 헬스 체크를 위한 모듈
    AuthModule, // 인증과 관련된 모듈
    RoomModule, // 회의방 생성과 관련된 모듈
    SignalingWebsocketModule, // 사실상 시그널링 서버의 역할을 하는 모듈
    SfuModule, // sfu와 관련되 모듈 ( 나중에 sfu 서버를 따로 분리할것을 생각하고 만든 모듈 그러니 sfu server라고 생각하면 될것 같다. )
    ToolConsumerModule, // tool이 사용하는 모듈
    SignalingBroadcasterModule, // signalling braod casting을 위해서 사용하는 모듈
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CookieParser()).forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
