import { InvalidTokenError, NotMakeJwtToken, TokenExpiredError } from '@error/infra/infra.error';
import { Payload, TokenDto } from '@app/auth/commands/dto';
import { TokenIssuer } from '@app/auth/ports';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jose from 'jose';

type TokenSecretProps = {
  access_token_secret: string;
  refresh_token_secret: string;
};

type TokenExpiredProps = {
  access_token_expired: string;
  refresh_token_expired: string;
};

@Injectable()
export class JwtTokenIssuer extends TokenIssuer {
  constructor(private readonly config: ConfigService) {
    super();
  }

  private async makeJwt({
    payload,
    secret_key,
    expired_time,
  }: {
    payload: Payload;
    secret_key: string;
    expired_time: string;
  }): Promise<string> {
    const issuer: string = this.config.get<string>('NODE_APP_JWT_ISSUE_NAME', 'issuer');
    const audience: string = this.config.get<string>('NODE_APP_JWT_AUDIENCE_NAME', 'audience');
    const algorithm: string = this.config.get<string>('NODE_APP_JWT_ALGORITHM', 'HS256');

    const secret: Uint8Array = new TextEncoder().encode(secret_key);

    const jwtToken: string = await new jose.SignJWT({ payload })
      .setProtectedHeader({ alg: algorithm })
      .setExpirationTime(expired_time)
      .setIssuer(issuer)
      .setAudience(audience)
      .sign(secret);

    return jwtToken;
  }

  public async makeIssuer(payload: Payload): Promise<TokenDto> {
    // secret key
    const secretKeys: TokenSecretProps = {
      access_token_secret: this.config.get<string>('NODE_APP_JWT_ACCESS_SECRET_KEY', 'access'),
      refresh_token_secret: this.config.get<string>('NODE_APP_JWT_REFRESH_SECRET_KEY', 'refresh'),
    };

    // expired time
    const expiredTimes: TokenExpiredProps = {
      access_token_expired: this.config.get<string>('NODE_APP_JWT_ACCESS_EXPIRED_TIME', '1m'),
      refresh_token_expired: this.config.get<string>('NODE_APP_JWT_REFRESH_EXPIRED_TIME', '1h'),
    };

    const access_token: string = await this.makeJwt({
      payload,
      secret_key: secretKeys.access_token_secret,
      expired_time: expiredTimes.access_token_expired,
    });

    const refresh_token: string = await this.makeJwt({
      payload,
      secret_key: secretKeys.refresh_token_secret,
      expired_time: expiredTimes.refresh_token_expired,
    });

    if (access_token && refresh_token) {
      const tokens: TokenDto = {
        access_token,
        refresh_token,
      };
      return tokens;
    } else throw new NotMakeJwtToken();
  }
}

@Injectable()
export class JwtAccessTokenIssuer extends TokenIssuer {
  private readonly secretKey: string;

  constructor(private readonly config: ConfigService) {
    super();
    this.secretKey = config.get<string>('NODE_APP_JWT_ACCESS_SECRET_KEY', 'secretKey');
  }

  private async makeJwtAccessToken(payload: Payload): Promise<string> {
    // access_token으로 기본 셋팅 되어 있음
    const issuer: string = this.config.get<string>('NODE_APP_JWT_ISSUE_NAME', 'issuer');
    const audience: string = this.config.get<string>('NODE_APP_JWT_AUDIENCE_NAME', 'audience');
    const algorithm: string = this.config.get<string>('NODE_APP_JWT_ALGORITHM', 'HS256');
    const secret_key: string = this.secretKey;
    const expired_time: string = this.config.get<string>('NODE_APP_JWT_ACCESS_EXPIRED_TIME', '1m');

    const secret: Uint8Array = new TextEncoder().encode(secret_key);

    const jwtToken: string = await new jose.SignJWT({ payload })
      .setProtectedHeader({ alg: algorithm })
      .setExpirationTime(expired_time)
      .setIssuer(issuer)
      .setAudience(audience)
      .sign(secret);

    return jwtToken;
  }

  // access_token 생성
  public async makeToken(payload: Payload): Promise<string> {
    // 토큰 생성에 기본설정들
    const access_token: string = await this.makeJwtAccessToken(payload);

    return access_token;
  }

  // 토큰 검증 - 시간 만료 부분 처리 해주어야 한다.
  public async tokenVerify(token: string): Promise<Payload> {
    try {
      const secretKey: Uint8Array = new TextEncoder().encode(this.secretKey);
      const algorithms: Array<string> = [
        this.config.get<string>('NODE_APP_JWT_ALGORITHM', 'HS256'),
      ];
      const issuer: string = this.config.get<string>('NODE_APP_JWT_ISSUE_NAME', 'issuer');
      const audience: string = this.config.get<string>('NODE_APP_JWT_AUDIENCE_NAME', 'audience');

      const { payload } = await jose.jwtVerify(token, secretKey, {
        algorithms,
        audience,
        issuer,
      });

      // 실제 payload를 파싱하기
      const payloadValue = payload.payload as Payload;

      return payloadValue;
    } catch (err) {
      if (err?.code === 'ERR_JWT_EXPIRED' || err?.name === 'JWTExpired') {
        throw new TokenExpiredError();
      }

      throw new InvalidTokenError(err?.message ?? '토큰에 문제가 발생했습니다.');
    }
  }
}

@Injectable()
export class RefreshTokenHashVerify extends TokenIssuer {
  private readonly secretKey: string;

  constructor(private readonly config: ConfigService) {
    super();
    this.secretKey = config.get<string>('NODE_APP_JWT_REFRESH_SECRET_KEY', 'secretKey');
  }

  public async tokenVerify(token: string): Promise<Payload> {
    const secretKey: Uint8Array = new TextEncoder().encode(this.secretKey);
    const algorithms: Array<string> = [this.config.get<string>('NODE_APP_JWT_ALGORITHM', 'HS256')];
    const issuer: string = this.config.get<string>('NODE_APP_JWT_ISSUE_NAME', 'issure');
    const audience: string = this.config.get<string>('NODE_APP_JWT_AUDIENCE_NAME', 'audience');

    const { payload } = await jose.jwtVerify(token, secretKey, {
      algorithms,
      audience,
      issuer,
    });

    // 실제 payload를 파싱하기
    const payloadValue = payload.payload as Payload;

    return payloadValue;
  }
}
