import { Injectable } from '@nestjs/common';
import { type PayloadRes } from '@app/auth/queries/dto';
import { type Payload, type TokenDto } from '@app/auth/commands/dto';
import { TokenIssuer } from '@app/auth/ports/token-issue';
import { UnthorizedError } from '@error/application/user/user.error';
import { CompareHash } from '@domain/shared';
import { SelectDataFromCache } from '@app/ports/cache/cache.inbound';

export type JwtAuthValueProps = {
  sessionNameSpace: string;
  refreshTokenHashKeyName: string;
};

type JwtAuthProps<T> = {
  usecaseValues: JwtAuthValueProps;
  accessTokenIssuer: TokenIssuer; //  access token과 관련해서 토큰도 만들고 검증도 진행할 예정입니다.
  refreshTokenVerify: TokenIssuer; // refresh token에 대해서 검증을 진행할 예정입니다.
  selectRefreshTokenHashFromCache: SelectDataFromCache<T>; // cache에서 데이터를 찾는걸 진행할 예정입니다.
  compareHash: CompareHash; // refresh_token_hash에 대해서 검증을 진행할 계획입니다.
};

// 인증을 담당하는 jwt usecase
@Injectable()
export class JwtAuth<T> {
  private readonly usecaseValues: JwtAuthValueProps;
  private readonly accessTokenIssuer: TokenIssuer;
  private readonly refreshTokenVerify: TokenIssuer;
  private readonly selectRefreshTokenHashFromCache: SelectDataFromCache<T>;
  private readonly compareHash: CompareHash;

  constructor({
    usecaseValues,
    accessTokenIssuer,
    refreshTokenVerify,
    selectRefreshTokenHashFromCache,
    compareHash,
  }: JwtAuthProps<T>) {
    this.usecaseValues = usecaseValues;
    this.accessTokenIssuer = accessTokenIssuer;
    this.refreshTokenVerify = refreshTokenVerify;
    this.selectRefreshTokenHashFromCache = selectRefreshTokenHashFromCache;
    this.compareHash = compareHash;
  }

  public async execute(dto: TokenDto): Promise<PayloadRes | undefined> {
    try {
      // 1-1. 검증
      const payload: Payload = await this.accessTokenIssuer.tokenVerify(dto.access_token);
      return { ...payload, access_token: dto.access_token };
    } catch (err) {
      if (err.code === 'TOKEN_EXPIRED') {
        try {
          // 2-1. 시간 만료 리프레시 검증
          const payload: Payload = await this.refreshTokenVerify.tokenVerify(dto.refresh_token);

          // 2-2. refresh_token hash값 찾기
          const namespace: string =
            `${this.usecaseValues.sessionNameSpace}:${payload.user_id}`.trim();
          const refresh_token_hash: string = await this.selectRefreshTokenHashFromCache.select({
            namespace,
            keyName: this.usecaseValues.refreshTokenHashKeyName,
          });
          if (!refresh_token_hash) throw new UnthorizedError('refresh_token이 존재하지 않습니다.');

          // 2-3. redis에서 refresh_token_hash검증하기
          const tokenChecked: boolean = await this.compareHash.compare({
            value: dto.refresh_token,
            hash: refresh_token_hash,
          });
          if (!tokenChecked)
            throw new UnthorizedError('refresh_token을 다시 확인해주시길 바랍니다.');

          // 2-4. 페이로드로 새로운 어세스 토큰 생성
          const new_access_token: string = await this.accessTokenIssuer.makeToken(payload);

          // 에러가 있으면 undefined를 반환 한다.
          return new_access_token ? { ...payload, access_token: new_access_token } : undefined;
        } catch (err) {
          throw new UnthorizedError(err.message);
        }
      } else {
        throw new UnthorizedError(err.message);
      }
    }
  }
}
