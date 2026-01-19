// 로컬을 이용해서 로그인 할 계정
import { Injectable } from '@nestjs/common';
import { LoginNormalUserDto, Payload, TokenDto } from '@app/auth/commands/dto';
import { SelectDataFromDb } from '@app/ports/db/db.inbound';
import { MakeHashPort } from '@app/ports/share';
import { TokenIssuer } from '@app/auth/ports';
import { InsertDataToCache } from '@app/ports/cache/cache.outbound';
import { NotAllowPasswordError, NotValidEmailError } from '@error/application/user/user.error';
import { CompareHash } from '@domain/shared';
import { UserProps } from '@domain/user/user.vo';
import { InsertCacheDataProps } from './login-oauth.usecase';

type LoginOauthUsecaseValueProps = {
  emailAttributeName: string;
};

type LoginOauthUsecaseProps<T1, T2> = {
  usecaseValues: LoginOauthUsecaseValueProps; // usecase에 사용되는 거
  selectUserEmailFromDb: SelectDataFromDb<T1>; // db에서 email 데이터 찾을때
  compareHash: CompareHash; // 비밀번호 비교를 위해서
  tokenIssuersInterfaceMakeIssuer: TokenIssuer; // token을 생성하기 위해서
  makeHash: MakeHashPort; // hash를 만들기 위해서
  insertRefreshDataToCache: InsertDataToCache<T2>; // cache에 refresh_token_hash를 저장하고자 함
};

@Injectable()
export class LoginUsecase<T1, T2> {
  private readonly usecaseValues: LoginOauthUsecaseProps<T1, T2>['usecaseValues'];
  private readonly selectUserEmailFromDb: LoginOauthUsecaseProps<T1, T2>['selectUserEmailFromDb'];
  private readonly compareHash: LoginOauthUsecaseProps<T1, T2>['compareHash'];
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
    selectUserEmailFromDb,
    compareHash,
    tokenIssuersInterfaceMakeIssuer,
    makeHash,
    insertRefreshDataToCache,
  }: LoginOauthUsecaseProps<T1, T2>) {
    this.usecaseValues = usecaseValues;
    this.selectUserEmailFromDb = selectUserEmailFromDb;
    this.compareHash = compareHash;
    this.tokenIssuersInterfaceMakeIssuer = tokenIssuersInterfaceMakeIssuer;
    this.makeHash = makeHash;
    this.insertRefreshDataToCache = insertRefreshDataToCache;
  }

  public async execute(dto: LoginNormalUserDto): Promise<TokenDto> {
    // 1. email 검증
    const user: UserProps | undefined = await this.selectUserEmailFromDb.select({
      attributeName: this.usecaseValues.emailAttributeName,
      attributeValue: dto.email,
    });
    if (!user) throw new NotValidEmailError();

    // 2. 비밀번호 검증
    if (user.password_hash === null) throw new NotAllowPasswordError(); // 없다는건 oauth이기 때문에
    const passwordChecked: boolean = await this.compareHash.compare({
      value: dto.password,
      hash: user.password_hash || '',
    });
    if (!passwordChecked) throw new NotAllowPasswordError();

    // 3. tokens 생성
    const payload: Payload = {
      user_id: user.user_id,
      email: user.email,
      nickname: user.nickname,
    };
    const issueTokens: TokenDto = await this.tokenIssuersInterfaceMakeIssuer.makeIssuer(payload);

    // 4. refresh_tokens hash화
    const refresh_token_hash: string = await this.makeHash.makeHash(issueTokens.refresh_token);

    // 5. refresh_token_hash 저장
    const insertData: InsertCacheDataProps = {
      user_id: user.user_id,
      refresh_token_hash,
    };
    await this.insertRefreshDataToCache.insert(insertData);

    // 6. tokens 반납
    return issueTokens;
  }
}
