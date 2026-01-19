import {
  LoginOauthUsecase,
  LoginUsecase,
  LogoutUseCase,
  OauthUsecase,
  SignUpOauthUsecase,
  SignUpUsecase,
} from '@app/auth/commands/usecase';
import {
  CreateUserNormalDto,
  CreateUserOauthDto,
  LoginNormalUserDto,
  LoginOauthUserDto,
  Payload,
  TokenDto,
  UserOauthDto,
} from '@app/auth/commands/dto';
import { HttpService } from '@nestjs/axios';
import { HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { NotGenerateUser } from '@error/presentation/user/user.error';
import { LoginValidate, SignUpValidate } from './auth.validate';
import { Response } from 'express';

type KakaoTokenResponse = {
  token_type: string;
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  refresh_token_expires_in?: number;
  scope?: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly config: ConfigService,
    private readonly http: HttpService,
    private readonly signUpUsecase: SignUpUsecase<any>,
    private readonly signUpOauthUsecase: SignUpOauthUsecase<any>,
    private readonly loginUsecase: LoginUsecase<any, any>,
    private readonly loginOauthUsecase: LoginOauthUsecase<any, any>,
    private readonly oauthUsecase: OauthUsecase<any, any>,
    private readonly logoutUsecase: LogoutUseCase<any>,
  ) {}

  // kakao에 인증서버에 코드 요청
  public getAuthTokenKakaoUrl(redirct_url: string): string {
    const rest_api_key: string = this.config.get<string>(
      'NODE_APP_KAKAO_REST_API_KEY',
      'rest_api_key',
    );

    const url: string =
      'https://kauth.kakao.com/oauth/authorize' +
      '?response_type=code' +
      `&client_id=${encodeURIComponent(rest_api_key)}` +
      `&redirect_uri=${encodeURIComponent(redirct_url)}`;

    return url;
  }

  // kakao에 리소스 인가서버에 access_token 요청
  public async getAccessTokenKakaoUrl(code: string, redirect_url: string) {
    const rest_api_key: string = this.config.get<string>(
      'NODE_APP_KAKAO_REST_API_KEY',
      'rest_api_key',
    );
    const clientSecret: string = this.config.get<string>(
      'NODE_APP_KAKAO_CLIENT_SECRET',
      'client_secret',
    );

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: rest_api_key,
      redirect_uri: redirect_url,
      code,
      ...(clientSecret ? { client_secret: clientSecret } : {}),
    });

    const res = await firstValueFrom(
      this.http.post<KakaoTokenResponse>('https://kauth.kakao.com/oauth/token', body.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }),
    );

    return res.data;
  }

  // kakao에 리소스 서버에서 실제 데이터 가져오기
  public async getDataKakaoUrl(access_token: string) {
    const res = await firstValueFrom(
      this.http.get('https://kapi.kakao.com/v2/user/me', {
        headers: { Authorization: `Bearer ${access_token}` },
      }),
    );

    return res.data;
  }

  // kakao에서 회원가입과 관련된 데이터 가져오기
  public async getDataKakaoLogicVerSignUp(code: string): Promise<CreateUserOauthDto> {
    // access_token 받기
    const backend_url: string = this.config.get<string>('NODE_BACKEND_SERVER', 'redirctUrl');
    const redirect_url: string = `${backend_url}/api/auth/signup/kakao/redirect`;
    const token = await this.getAccessTokenKakaoUrl(code, redirect_url);

    // 데이터
    const kakaoData = await this.getDataKakaoUrl(token.access_token);
    const signUpData: CreateUserOauthDto = {
      provider: 'kakao',
      provider_id: String(kakaoData.id),
      email: String(kakaoData.kakao_account.email),
      nickname: String(kakaoData.properties.nickname),
    };

    return signUpData;
  }

  // kakao에서 로그인과 관련된 데이터 가져오기
  public async getDataKakaoLogicVerLogin(code: string): Promise<LoginOauthUserDto> {
    // access_token 받기
    const backend_url: string = this.config.get<string>('NODE_BACKEND_SERVER', 'redirctUrl');
    const redirect_url: string = `${backend_url}/api/auth/login/kakao/redirect`;
    const token = await this.getAccessTokenKakaoUrl(code, redirect_url);

    // 데이터
    const kakaoData = await this.getDataKakaoUrl(token.access_token);
    const loginData: LoginOauthUserDto = {
      provider: 'kakao',
      provider_id: String(kakaoData.id),
      email: String(kakaoData.kakao_account.email),
    };

    return loginData;
  }

  // kakao에 인증서버에 코드 요청
  public getKakaoUrl(redirct_url: string, state: string): string {
    const rest_api_key: string = this.config.get<string>(
      'NODE_APP_KAKAO_REST_API_KEY',
      'rest_api_key',
    );

    const url: string =
      'https://kauth.kakao.com/oauth/authorize' +
      '?response_type=code' +
      `&client_id=${encodeURIComponent(rest_api_key)}` +
      `&redirect_uri=${encodeURIComponent(redirct_url)}` +
      `&state=${encodeURIComponent(state)}`; // frontend에서 이를 검증할 예정이다.

    return url;
  }

  public async getDataKakaoLogic(code: string): Promise<UserOauthDto> {
    // access_token 받기
    const backend_url: string = this.config.get<string>('NODE_BACKEND_SERVER', 'redirctUrl');
    const redirect_url: string = `${backend_url}/api/auth/kakao/redirect`;
    const token = await this.getAccessTokenKakaoUrl(code, redirect_url);

    // 데이터
    const kakaoData = await this.getDataKakaoUrl(token.access_token);
    const oauthData: UserOauthDto = {
      provider: 'kakao',
      provider_id: String(kakaoData.id),
      email: String(kakaoData.kakao_account.email),
      nickname: String(kakaoData.properties.nickname),
    };

    return oauthData;
  }

  // 실제 회원 가입이 이루어지는 로직 - local
  public async signUpService(validate: SignUpValidate): Promise<void> {
    try {
      const dto: CreateUserNormalDto = {
        email: validate.email,
        password: validate.password,
        nickname: validate.nickname,
      };
      const signupChecked: boolean = await this.signUpUsecase.execute(dto);

      if (!signupChecked) throw new NotGenerateUser();
    } catch (err) {
      throw new HttpException(
        {
          message: err.message || err,
          status: err.status || 500,
        },
        err.status || 500,
        {
          cause: err,
        },
      );
    }
  }

  // 실제 회원 가입이 이루어지는 로직 - oauth2
  public async signUpVerOauthService(signUpData: CreateUserOauthDto): Promise<void> {
    try {
      const generateChecked: boolean = await this.signUpOauthUsecase.execute(signUpData);

      if (generateChecked) return;
      else throw new NotGenerateUser();
    } catch (err) {
      throw new HttpException(
        {
          message: err.message || err,
          status: err.status || 500,
        },
        err.status || 500,
        {
          cause: err,
        },
      );
    }
  }

  // 실제 로그인이 이루어지는 로직 - local
  public async loginService(validate: LoginValidate): Promise<TokenDto> {
    try {
      const dto: LoginNormalUserDto = {
        email: validate.email,
        password: validate.password,
      };

      const tokens: TokenDto = await this.loginUsecase.execute(dto);

      return tokens;
    } catch (err) {
      throw new HttpException(
        {
          message: err.message || err,
          status: err.status || 500,
        },
        err.status || 500,
        {
          cause: err,
        },
      );
    }
  }

  // 실제 로그인이 이루어지는 로직 - oauth2
  public async loginVerOauthService(loginData: LoginOauthUserDto): Promise<TokenDto> {
    try {
      const tokens: TokenDto = await this.loginOauthUsecase.execute(loginData);

      return tokens;
    } catch (err) {
      throw new HttpException(
        {
          message: err.message || err,
          status: err.status || 500,
        },
        err.status || 500,
        {
          cause: err,
        },
      );
    }
  }

  public async authKakaoService(oauthData: UserOauthDto): Promise<TokenDto> {
    return this.oauthUsecase.execute(oauthData);
  }

  // 실제 로그아웃이 이루어지는 로직
  public async logoutService(payload: Payload): Promise<void> {
    try {
      await this.logoutUsecase.execute(payload);
    } catch (err) {
      throw new HttpException(
        {
          message: err.message || err,
          status: err.status || 500,
        },
        err.status || 500,
        {
          cause: err,
        },
      );
    }
  }
}
