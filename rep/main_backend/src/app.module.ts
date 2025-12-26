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
import { RedisModule } from '@infra/cache/redis/redis';
import { JwtModule } from '@infra/auth/jwt/jwt.module';
import { CardModule } from '@present/http/card/card.module';
import { S3DiskModule } from '@infra/disk/s3/disk';
import { RedisChannelModule } from './3-1.infra/channel/redis/channel';

@Module({
  imports: [
    // 사용 모듈
    ConfigModule.forRoot({}),

    // infra
    MysqlModule, // mysql을 사용하기 위한 모듈
    RedisModule, // redis를 사용하기 위한 모듈
    JwtModule, // jwt를 사용하기 위한 모듈
    S3DiskModule, // s3를 사용하기 위한 모듈
    RedisChannelModule, // redis를 활용한 pub sub을 이용하기 위한 모듈

    // 우리가 집적 만든 모듈
    SettingModule, // 헬스 체크를 위한 모듈
    AuthModule, // 인증과 관련된 모듈
    CardModule, // card와 관련된 모듈
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
