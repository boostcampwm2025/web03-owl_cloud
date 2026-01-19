import { Injectable } from '@nestjs/common';
import { LoginOauthUserDto, Payload, TokenDto } from '@app/auth/commands/dto';
import { SelectDataFromDb } from '@app/ports/db/db.inbound';
import { MakeHashPort } from '@app/ports/share';
import { TokenIssuer } from '@app/auth/ports';
import { InsertDataToCache } from '@app/ports/cache/cache.outbound';
import { type OauthUserProps, type UserProps } from '@domain/user/user.vo';
import { NotAllowOauthLoginError, NotValidEmailError } from '@error/application/user/user.error';

type LoginOauthUsecaseValueProps = {
  emailAttributeName: string;
};

type LoginOauthUsecaseProps<T1, T2> = {
  usecaseValues: LoginOauthUsecaseValueProps; // usecase에 사용되는 거
  selectUserAndOauthWhereEmailFromDb: SelectDataFromDb<T1>; // db에서 email 데이터 찾을때
  tokenIssuersInterfaceMakeIssuer: TokenIssuer; // token을 생성하기 위해서
  makeHash: MakeHashPort; // hash를 만들기 위해서
  insertRefreshDataToCache: InsertDataToCache<T2>; // cache에 refresh_token_hash를 저장하고자 함
};

// 실제 user, oauth 데이터 정보를 담았음
export type CheckOauthDataType = {
  user_id: UserProps['user_id'];
  email: UserProps['email'];
  nickname: UserProps['nickname'];
  provider: OauthUserProps['provider'];
  provider_id: OauthUserProps['provider_id'];
};

// insert할 데이터 정보
export type InsertCacheDataProps = {
  user_id: string;
  refresh_token_hash: string;
};

@Injectable()
export class LoginOauthUsecase<T1, T2> {
  private readonly usecaseValues: LoginOauthUsecaseProps<T1, T2>['usecaseValues'];
  private readonly selectUserAndOauthWhereEmailFromDb: LoginOauthUsecaseProps<
    T1,
    T2
  >['selectUserAndOauthWhereEmailFromDb'];
  private readonly tokenIssuersInterfaceMakeIssuer: LoginOauthUsecaseProps<
    T1,
    T2
  >['tokenIssuersInterfaceMakeIssuer'];
  private readonly makeHash: LoginOauthUsecaseProps<T1, T2>['makeHash'];
  private readonly insertRefreshDataToCache: LoginOauthUsecaseProps<
    T1,
    T2
  >['insertRefreshDataToCache'];

  constructor({
    usecaseValues,
    selectUserAndOauthWhereEmailFromDb,
    tokenIssuersInterfaceMakeIssuer,
    makeHash,
    insertRefreshDataToCache,
  }: LoginOauthUsecaseProps<T1, T2>) {
    this.usecaseValues = usecaseValues;
    this.selectUserAndOauthWhereEmailFromDb = selectUserAndOauthWhereEmailFromDb;
    this.tokenIssuersInterfaceMakeIssuer = tokenIssuersInterfaceMakeIssuer;
    this.makeHash = makeHash;
    this.insertRefreshDataToCache = insertRefreshDataToCache;
  }

  public async execute(dto: LoginOauthUserDto): Promise<TokenDto> {
    // 1. email 검증
    const oauthUser: CheckOauthDataType | undefined =
      await this.selectUserAndOauthWhereEmailFromDb.select({
        attributeName: this.usecaseValues.emailAttributeName,
        attributeValue: dto.email,
      });
    if (!oauthUser) throw new NotValidEmailError();

    // 2. provider, provider_id 검증
    if (oauthUser.provider !== dto.provider || oauthUser.provider_id !== dto.provider_id)
      throw new NotAllowOauthLoginError();

    // 3. tokens 생성
    const payload: Payload = {
      user_id: oauthUser.user_id,
      email: oauthUser.email,
      nickname: oauthUser.nickname,
    };
    const issueTokens: TokenDto = await this.tokenIssuersInterfaceMakeIssuer.makeIssuer(payload);

    // 4. refresh_tokens hash화
    const refresh_token_hash: string = await this.makeHash.makeHash(issueTokens.refresh_token);

    // 5. refresh_token_hash 저장
    const insertData: InsertCacheDataProps = {
      user_id: oauthUser.user_id,
      refresh_token_hash,
    };
    await this.insertRefreshDataToCache.insert(insertData);

    // 6. tokens 반납
    return issueTokens;
  }
}
