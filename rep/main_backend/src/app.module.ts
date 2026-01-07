import "dotenv/config";
import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import CookieParser from 'cookie-parser';
import { MysqlModule } from '@infra/db/mysql/db';
import { SettingModule } from '@present/http/setting/setting.module';
import { AuthModule } from '@present/http/auth/auth.module';
import { RedisModule } from '@infra/cache/redis/cache';
import { JwtModule } from '@infra/auth/jwt/jwt.module';
import { S3DiskModule } from '@infra/disk/s3/disk';
import { RedisChannelModule } from '@infra/channel/redis/channel';
import { RoomModule } from "@present/http/room/room.module";
import { SignalingWebsocketModule  } from "@present/websocket/signaling/signaling.module";


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

    // 우리가 집적 만든 모듈
    SettingModule, // 헬스 체크를 위한 모듈
    AuthModule, // 인증과 관련된 모듈
    RoomModule, // 회의방 생성과 관련된 모듈
    SignalingWebsocketModule , // 사실상 시그널링 서버의 역할을 하는 모듈 

  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CookieParser())
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
