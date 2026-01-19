import { AuthModule } from '@present/http/auth/auth.module';
import { Module } from '@nestjs/common';
import { JwtWsGuard } from './guards/jwt.guard';

@Module({
  imports: [AuthModule],
  providers: [JwtWsGuard],
  exports: [JwtWsGuard],
})
export class AuthWebsocketModule {}
