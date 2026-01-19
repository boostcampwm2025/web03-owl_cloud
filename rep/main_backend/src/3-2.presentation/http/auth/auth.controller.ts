import { EmptyAuthCode, NotAllowState } from '@error/presentation/user/user.error';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { type Response } from 'express';
import { AuthService } from '@present/http/auth/auth.service';
import {
  CreateUserOauthDto,
  LoginOauthUserDto,
  Payload,
  TokenDto,
  UserOauthDto,
} from '@app/auth/commands/dto';
import { JwtGuard } from './guards';
import { LoginValidate, SignUpValidate } from './auth.validate';
import { randomBytes } from 'crypto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly config: ConfigService,
    private readonly authService: AuthService,
  ) {}

  // 로컬에서 회원가입이 이루어지는 컨트롤러
  @Post('signup')
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  )
  public async signUpController(@Body() dto: SignUpValidate): Promise<Record<string, string>> {
    await this.authService.signUpService(dto);
    return { status: 'ok' };
  }

  // kakao 회원가입
  @Post('signup/kakao')
  public signUpForKakaoController(@Res({ passthrough: true }) res: Response): void {
    const backend_url: string = this.config.get<string>('NODE_BACKEND_SERVER', 'redirctUrl');
    const redirect_url: string = `${backend_url}/api/auth/signup/kakao/redirect`;
    const url: string = this.authService.getAuthTokenKakaoUrl(redirect_url);
    res.redirect(url);
  }

  // kakao 회원가입 리다이렉트
  @Get('signup/kakao/redirect')
  @HttpCode(201)
  public async signUpForKakaoRedirectController(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const code = (req as any).query?.code; // code 읽어오기
    if (!code) throw new EmptyAuthCode();
    const signUpData: CreateUserOauthDto = await this.authService.getDataKakaoLogicVerSignUp(code);
    await this.authService.signUpVerOauthService(signUpData); // 실제 로그인

    const frontend = this.config.get<string>('NODE_FRONTEND_SERVER', 'http://localhost:3000');
    res.redirect(`${frontend}`);
  }

  // 로그인 관련 - local
  @Post('login')
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  )
  @HttpCode(200)
  public async loginController(
    @Body() dto: LoginValidate,
    @Res({ passthrough: true }) res: Response,
  ): Promise<Record<string, string>> {
    const tokens: TokenDto = await this.authService.loginService(dto);

    // refresh_token은 cookie로
    res.cookie('refresh_token', tokens.refresh_token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 밀리초
      path: '/',
      sameSite: 'lax',
    });

    // access_token은 body로
    return { access_token: tokens.access_token };
  }

  // 로그인 관련 - kakao
  @Post('login/kakao')
  public loginForKakaoController(@Res({ passthrough: true }) res: Response): void {
    const backend_url: string = this.config.get<string>('NODE_BACKEND_SERVER', 'redirctUrl');
    const redirect_url: string = `${backend_url}/api/auth/login/kakao/redirect`;
    const url: string = this.authService.getAuthTokenKakaoUrl(redirect_url);
    res.redirect(url);
  }

  @Get('login/kakao/redirect')
  public async loginForKakaoRedirectController(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const code = (req as any).query?.code; // 코드확인
    if (!code) throw new EmptyAuthCode();
    const loginData: LoginOauthUserDto = await this.authService.getDataKakaoLogicVerLogin(code);
    const tokens: TokenDto = await this.authService.loginVerOauthService(loginData); // 실제 로그인

    // refresh_token은 cookie로
    res.cookie('refresh_token', tokens.refresh_token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 밀리초
      path: '/',
      sameSite: 'lax',
    });

    // access_token은 body로
    const frontend = this.config.get<string>('NODE_FRONTEND_SERVER', 'http://localhost:3000');
    res.redirect(`${frontend}?access_token=${encodeURIComponent(tokens.access_token)}`); // 여기서 frontend 뒤에 원하는 부분으로 리다이렉트 시켜주면 될겁니다.
  }

  // BFF 방식 oauth2 인증
  @Get('kakao/url')
  public authKakaoController(@Res({ passthrough: true }) res: Response): Record<string, string> {
    const backend_url: string = this.config.get<string>('NODE_BACKEND_SERVER', 'redirctUrl');
    const redirect_url: string = `${backend_url}/api/auth/kakao/redirect`;

    // state를 프론트에게 쿠키로 보낸다.
    const state: string = randomBytes(32).toString('hex');

    // cookie로 전달
    res.cookie('oauth_state', state, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 5 * 60 * 1000,
      path: '/',
    });

    // 프론트엔드는 지금 카카오에게 집적 이야기 하기 위해서 url을 요청한다.
    const url: string = this.authService.getKakaoUrl(redirect_url, state);

    return { url };
  }

  // 로그인 + 회원가입 동시 인증
  @Get('kakao/redirect')
  async authKakaoRedirectController(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const frontend = this.config.get<string>('NODE_FRONTEND_SERVER', 'http://localhost:3000');
    try {
      const code = (req as any).query?.code;
      if (!code) throw new EmptyAuthCode();

      // state 검증 -> 이를 이용해서 검증할 수 있다.
      const state = (req as any).query?.state;
      if (!state) throw new NotAllowState();
      const cookieState = (req as any).cookies?.oauth_state;
      if (!cookieState || cookieState !== state) throw new NotAllowState();
      res.clearCookie('oauth_state', { path: '/' });

      const oauthData: UserOauthDto = await this.authService.getDataKakaoLogic(code);

      const tokens: TokenDto = await this.authService.authKakaoService(oauthData);

      res.cookie('refresh_token', tokens.refresh_token, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 밀리초
        path: '/',
        sameSite: 'lax',
      });

      // access_token은 body로
      res.redirect(`${frontend}/auth#access_token=${encodeURIComponent(tokens.access_token)}`);
    } catch (err) {
      const status = err?.status ?? 500;
      const message = encodeURIComponent(err?.message ?? 'oauth failed');
      return void res.redirect(`${frontend}/auth/error?status=${status}&message=${message}`);
    }
  }

  // 로그아웃과 관련
  @UseGuards(JwtGuard)
  @Delete('logout')
  public async logoutController(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<Record<string, string>> {
    const payload: Payload = (req as any).user;
    await this.authService.logoutService(payload);

    // header로 x-access-token 빈값으로 전달
    res.setHeader('x-access-token', '');

    // cookie 삭제
    res.clearCookie('refresh_token', {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    });

    return { status: 'ok' };
  }

  // 유저 정보를 받아오는 로직
  @UseGuards(JwtGuard)
  @Get('me')
  public async meController(@Req() req: Request): Promise<Payload> {
    const payload: Payload = (req as any).user;
    return payload;
  }
}
