import { JwtModule } from '@infra/auth/jwt/jwt.module';
import {
  SelectUserAndOauthFromMysql,
  SelectUserAndOauthWhereEmailFromMysql,
  SelectUserDataFromMysql,
} from '@infra/db/mysql/user/user.inbound';
import {
  LoginOauthUsecase,
  LoginUsecase,
  LogoutUseCase,
  OauthUsecase,
  SignUpOauthUsecase,
  SignUpUsecase,
} from '@app/auth/commands/usecase';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthController } from '@present/http/auth/auth.controller';
import { AuthService } from '@present/http/auth/auth.service';
import {
  CompareArgonHash,
  JWT_SESSION_NAMESPACE_ATTR,
  MakeArgonHash,
  REFRESH_TOKEN_HASH_KEY_NAME_ATTR,
  UserIdGenerator,
  USERS_EMAIL_ATTR,
} from './auth.interface';
import {
  InsertOauthAndUserDataToMysql,
  InsertUserDataToMySql,
} from '@infra/db/mysql/user/user.outbound';
import { DB_USERS_ATTRIBUTE_NAME } from '@infra/db/db.constants';
import {
  JwtAccessTokenIssuer,
  JwtTokenIssuer,
  RefreshTokenHashVerify,
} from '@infra/auth/jwt/jwt.token';
import {
  DeleteUserDataToRedis,
  InsertUserSessionDataToRedis,
} from '@infra/cache/redis/user/user.outbound';
import {
  CACHE_USER_NAMESPACE_NAME,
  CACHE_USER_SESSION_KEY_NAME,
} from '@infra/cache/cache.constants';
import { JwtAuth } from '@app/auth/queries/usecase';
import { SelectHsetDataFromRedis } from '@infra/cache/redis/user/user.inbound';
import { JwtGuard } from './guards';

@Module({
  imports: [HttpModule, JwtModule],
  controllers: [AuthController],
  providers: [
    // 설치 되어 있는거 사용
    ConfigService,
    UserIdGenerator, // user_id 생성 관련
    MakeArgonHash, // argon2를 이용한 해시 생성
    CompareArgonHash, // argon2를 이용한 해시 비교

    // 다른 모듈 import
    // 회원 가입 유스케이스 - local
    {
      provide: USERS_EMAIL_ATTR,
      useValue: DB_USERS_ATTRIBUTE_NAME.EMAIL,
    },
    {
      provide: SignUpUsecase,
      useFactory: (
        emailAttributeName: string,
        selectDataWhereEmailFromDb: SelectUserDataFromMysql,
        insertUserDataToDb: InsertUserDataToMySql,
        userIdGenerator: UserIdGenerator,
        makeHash: MakeArgonHash,
      ) => {
        return new SignUpUsecase({
          usecaseValues: { emailAttributeName },
          selectDataWhereEmailFromDb,
          insertUserDataToDb,
          userIdGenerator,
          makeHash,
        });
      },
      inject: [
        USERS_EMAIL_ATTR,
        SelectUserDataFromMysql,
        InsertUserDataToMySql,
        UserIdGenerator,
        MakeArgonHash,
      ],
    },

    // 회원 가입 유스케이스 - oauth
    {
      provide: SignUpOauthUsecase,
      useFactory: (
        emailAttributeName: string,
        selectDataWhereEmailFromDb: SelectUserDataFromMysql,
        userIdGenerator: UserIdGenerator,
        insertUserAndOauthDataToDb: InsertOauthAndUserDataToMysql,
      ) => {
        return new SignUpOauthUsecase({
          usecaseValues: { emailAttributeName },
          selectDataWhereEmailFromDb,
          userIdGenerator,
          insertUserAndOauthDataToDb,
        });
      },
      inject: [
        USERS_EMAIL_ATTR,
        SelectUserDataFromMysql,
        UserIdGenerator,
        InsertOauthAndUserDataToMysql,
      ],
    },

    // 로그인 유스케이스 - local
    {
      provide: LoginUsecase,
      useFactory: (
        emailAttributeName: string,
        selectUserEmailFromDb: SelectUserDataFromMysql,
        compareHash: CompareArgonHash,
        tokenIssuersInterfaceMakeIssuer: JwtTokenIssuer,
        makeHash: MakeArgonHash,
        insertRefreshDataToCache: InsertUserSessionDataToRedis,
      ) => {
        return new LoginUsecase({
          usecaseValues: { emailAttributeName },
          selectUserEmailFromDb,
          compareHash,
          tokenIssuersInterfaceMakeIssuer,
          makeHash,
          insertRefreshDataToCache,
        });
      },
      inject: [
        USERS_EMAIL_ATTR,
        SelectUserDataFromMysql,
        CompareArgonHash,
        JwtTokenIssuer,
        MakeArgonHash,
        InsertUserSessionDataToRedis,
      ],
    },

    // 로그인 유스케이스 - oauth
    {
      provide: LoginOauthUsecase,
      useFactory: (
        emailAttributeName: string,
        selectUserAndOauthWhereEmailFromDb: SelectUserAndOauthWhereEmailFromMysql,
        tokenIssuersInterfaceMakeIssuer: JwtTokenIssuer,
        makeHash: MakeArgonHash,
        insertRefreshDataToCache: InsertUserSessionDataToRedis,
      ) => {
        return new LoginOauthUsecase({
          usecaseValues: { emailAttributeName },
          selectUserAndOauthWhereEmailFromDb,
          tokenIssuersInterfaceMakeIssuer,
          makeHash,
          insertRefreshDataToCache,
        });
      },
      inject: [
        USERS_EMAIL_ATTR,
        SelectUserAndOauthWhereEmailFromMysql,
        JwtTokenIssuer,
        MakeArgonHash,
        InsertUserSessionDataToRedis,
      ],
    },

    // jwt 검증 관련 유스케이스
    {
      provide: JWT_SESSION_NAMESPACE_ATTR,
      useValue: CACHE_USER_NAMESPACE_NAME.SESSION_USER,
    },
    {
      provide: REFRESH_TOKEN_HASH_KEY_NAME_ATTR,
      useValue: CACHE_USER_SESSION_KEY_NAME.REFRESH_TOKEN_HASH,
    },
    {
      provide: JwtAuth,
      useFactory: (
        sessionNameSpace: string,
        refreshTokenHashKeyName: string,
        accessTokenIssuer: JwtAccessTokenIssuer,
        refreshTokenVerify: RefreshTokenHashVerify,
        selectRefreshTokenHashFromCache: SelectHsetDataFromRedis,
        compareHash: CompareArgonHash,
      ) => {
        return new JwtAuth({
          usecaseValues: { sessionNameSpace, refreshTokenHashKeyName },
          accessTokenIssuer,
          refreshTokenVerify,
          selectRefreshTokenHashFromCache,
          compareHash,
        });
      },
      inject: [
        JWT_SESSION_NAMESPACE_ATTR,
        REFRESH_TOKEN_HASH_KEY_NAME_ATTR,
        JwtAccessTokenIssuer,
        RefreshTokenHashVerify,
        SelectHsetDataFromRedis,
        CompareArgonHash,
      ],
    },

    // 로그아웃 usecase
    {
      provide: LogoutUseCase,
      useFactory: (
        userSessionNamespace: string,
        refreshTokenHashKeyName: string,
        deleteUserSessionToCache: DeleteUserDataToRedis,
      ) => {
        return new LogoutUseCase({
          usecaseValues: { userSessionNamespace, refreshTokenHashKeyName },
          deleteUserSessionToCache,
        });
      },
      inject: [JWT_SESSION_NAMESPACE_ATTR, REFRESH_TOKEN_HASH_KEY_NAME_ATTR, DeleteUserDataToRedis],
    },

    // 로그인 회원가입이 원큐에 되는 oauth 로직
    {
      provide: OauthUsecase,
      useFactory: (
        emailAttributeName: string,
        selectUserAndOauthWhereEmailFromDb: SelectUserAndOauthFromMysql,
        userIdGenerator: UserIdGenerator,
        insertUserAndOauthDataToDb: InsertOauthAndUserDataToMysql,
        tokenIssuersInterfaceMakeIssuer: JwtTokenIssuer,
        makeHash: MakeArgonHash,
        insertRefreshDataToCache: InsertUserSessionDataToRedis,
      ) => {
        return new OauthUsecase({
          usecaseValues: { emailAttributeName },
          selectUserAndOauthWhereEmailFromDb,
          userIdGenerator,
          insertUserAndOauthDataToDb,
          tokenIssuersInterfaceMakeIssuer,
          makeHash,
          insertRefreshDataToCache,
        });
      },
      inject: [
        USERS_EMAIL_ATTR,
        SelectUserAndOauthFromMysql,
        UserIdGenerator,
        InsertOauthAndUserDataToMysql,
        JwtTokenIssuer,
        MakeArgonHash,
        InsertUserSessionDataToRedis,
      ],
    },

    // 자체 service
    AuthService,
    UserIdGenerator,
    JwtGuard,
  ],
  exports: [JwtGuard, JwtAuth],
})
export class AuthModule {}
