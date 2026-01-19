import { Injectable } from '@nestjs/common';
import { Payload, TokenDto, UserOauthDto } from '../dto';
import { SelectDataFromDb } from '@app/ports/db/db.inbound';
import { OauthUserProps, UserProps } from '@domain/user/user.vo';
import {
  NotAllowOauthLoginError,
  NotInvalidOauthUserError,
  NotValidEmailError,
} from '@error/application/user/user.error';
import { UserAggregate } from '@domain/user/user.aggregate';
import { IdGenerator } from '@domain/shared';
import { InsertOauthUserDataProps } from './connect-oauth.usecase';
import { InsertValueToDb } from '@app/ports/db/db.outbound';
import { TokenIssuer } from '../../ports';
import { MakeHashPort } from '@app/ports/share';
import { InsertCacheDataProps } from './login-oauth.usecase';
import { InsertDataToCache } from '@app/ports/cache/cache.outbound';

export type OauthDataProps = {
  user_id: UserProps['user_id'];
  email: UserProps['email'];
  nickname: UserProps['nickname'];
  provider: OauthUserProps['provider'];
  provider_id: OauthUserProps['provider_id'];
};

type OauthUsecaseValueProps = {
  emailAttributeName: string;
};

type OauthUsecaseProps<T, CT> = {
  usecaseValues: OauthUsecaseValueProps;
  selectUserAndOauthWhereEmailFromDb: SelectDataFromDb<T>;
  userIdGenerator: IdGenerator;
  insertUserAndOauthDataToDb: InsertValueToDb<T>;
  tokenIssuersInterfaceMakeIssuer: TokenIssuer;
  makeHash: MakeHashPort;
  insertRefreshDataToCache: InsertDataToCache<CT>;
};

@Injectable()
export class OauthUsecase<T, CT> {
  private readonly usecaseValues: OauthUsecaseProps<T, CT>['usecaseValues'];
  private readonly selectUserAndOauthWhereEmailFromDb: OauthUsecaseProps<
    T,
    CT
  >['selectUserAndOauthWhereEmailFromDb'];
  private readonly userIdGenerator: OauthUsecaseProps<T, CT>['userIdGenerator'];
  private readonly insertUserAndOauthDataToDb: OauthUsecaseProps<
    T,
    CT
  >['insertUserAndOauthDataToDb'];
  private readonly tokenIssuersInterfaceMakeIssuer: OauthUsecaseProps<
    T,
    CT
  >['tokenIssuersInterfaceMakeIssuer'];
  private readonly makeHash: OauthUsecaseProps<T, CT>['makeHash'];
  private readonly insertRefreshDataToCache: OauthUsecaseProps<T, CT>['insertRefreshDataToCache'];

  constructor({
    usecaseValues,
    selectUserAndOauthWhereEmailFromDb,
    userIdGenerator,
    insertUserAndOauthDataToDb,
    tokenIssuersInterfaceMakeIssuer,
    makeHash,
    insertRefreshDataToCache,
  }: OauthUsecaseProps<T, CT>) {
    this.usecaseValues = usecaseValues;
    this.selectUserAndOauthWhereEmailFromDb = selectUserAndOauthWhereEmailFromDb;
    this.userIdGenerator = userIdGenerator;
    this.insertUserAndOauthDataToDb = insertUserAndOauthDataToDb;
    this.tokenIssuersInterfaceMakeIssuer = tokenIssuersInterfaceMakeIssuer;
    this.makeHash = makeHash;
    this.insertRefreshDataToCache = insertRefreshDataToCache;
  }

  async execute(dto: UserOauthDto): Promise<TokenDto> {
    // 1. user 정보 가져오기
    let oauthUser: OauthDataProps | undefined;
    oauthUser = await this.selectUserAndOauthWhereEmailFromDb.select({
      attributeName: this.usecaseValues.emailAttributeName,
      attributeValue: dto,
    });

    // 회원가입이 안되어있음
    if (!oauthUser) {
      // 1. user 객체 생성 - 정합성 파악
      const userAggregate = UserAggregate.create({
        input: {
          email: dto.email,
          nickname: dto.nickname,
          password_hash: undefined,
        },
        userIdGenerator: this.userIdGenerator,
      });
      const userData: UserProps = userAggregate.getUserData();

      // 2. oauth용 객체 생성 - 정합성 파악
      const oauthData: OauthUserProps | undefined = userAggregate
        .connectOauth({
          provider: dto.provider,
          provider_id: dto.provider_id,
          created_at: userData.created_at || new Date(),
          updated_at: userData.updated_at || new Date(),
        })
        .getOauthUserData();
      if (!oauthData) throw new NotInvalidOauthUserError();

      // 3. 유저 + oauth 정보 저장
      const insertData: InsertOauthUserDataProps = {
        userData,
        oauthData,
      };

      await this.insertUserAndOauthDataToDb.insert(insertData);

      // 회원가입에 경우
      oauthUser = {
        ...oauthData,
        ...userData,
      };
    }

    // 2. tokens 생성
    const payload: Payload = {
      user_id: oauthUser.user_id,
      email: oauthUser.email,
      nickname: oauthUser.nickname,
    };
    const issueTokens: TokenDto = await this.tokenIssuersInterfaceMakeIssuer.makeIssuer(payload);

    // 3. refresh_tokens hash화
    const refresh_token_hash: string = await this.makeHash.makeHash(issueTokens.refresh_token);

    // 4. refresh_token_hash 저장
    const insertData: InsertCacheDataProps = {
      user_id: oauthUser.user_id,
      refresh_token_hash,
    };
    await this.insertRefreshDataToCache.insert(insertData);

    // 5. tokens 반납
    return issueTokens;
  }
}
