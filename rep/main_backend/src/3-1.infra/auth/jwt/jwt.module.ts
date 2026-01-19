import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtAccessTokenIssuer, JwtTokenIssuer, RefreshTokenHashVerify } from './jwt.token';

@Global()
@Module({
  providers: [ConfigService, JwtTokenIssuer, JwtAccessTokenIssuer, RefreshTokenHashVerify],
  exports: [JwtTokenIssuer, JwtAccessTokenIssuer, RefreshTokenHashVerify],
})
export class JwtModule {}
