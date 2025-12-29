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
import { CardModule } from '@present/http/card/card.module';
import { S3DiskModule } from '@infra/disk/s3/disk';
import { RedisChannelModule } from '@infra/channel/redis/channel';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from "path";
import { type Request, type Response } from "express";
import { SettingGraphqlModule } from '@present/graphql/setting/setting.module';
import { CardGraphqlModule } from "@present/graphql/card/card.module";
import GraphQLJSON from "graphql-type-json";

@Module({
  imports: [
    // 사용 모듈
    ConfigModule.forRoot({}), // env 파일을 사용하기 위해서 설치한 모듈 global로 설정하여 import 필요없게 했음
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver : ApolloDriver, // apollo가 graphql에 대해서 관리할 수 있도록 처리

      // 경로 변경 
      path : "/api/graphql",

      autoSchemaFile : join( process.cwd(), "src/3-2.presentation/graphql/schema.gql" ), // 파일 고정 ( graphql 파일 생성 )
      sortSchema : true, // graphql 파일이 자주 변경되는걸 막아주고 알파벳 순으로 정렬되도록 함
      resolvers : {
        JSON : GraphQLJSON // json을 어떤 방식으로 처리해야 하는지 알려줌
      },

      playground : process.env.NODE_ENV !== "production", // graphql 테스트 
      introspection : process.env.NODE_ENV !== "production", // 그 playground를 조회할 수 있게 하는 기능 

      context : ({ req, res } : { req : Request, res : Response }) => ({ req, res }) // req, res 접근을 만들 수 있다면 ( 공통적으로 graphql이 모두 받게 되는 context )
    }), // graphql에 대한 진입점도 만들고 그에 따른 처리를 하기 위해서 사용

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
    SettingGraphqlModule, // graphql에 헬스체크를 위한 모듈
    CardGraphqlModule, // graphql에서 card와 관련된 모듈

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
