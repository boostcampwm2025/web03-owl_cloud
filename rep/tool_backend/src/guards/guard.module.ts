import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GuardService } from './guard.service';

@Global()
@Module({
  providers: [ConfigService, GuardService],
  exports: [GuardService],
})
export class GuardModule {}
