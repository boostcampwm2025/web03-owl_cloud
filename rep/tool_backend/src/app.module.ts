import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './health/health.module';


@Module({
  imports: [
    ConfigModule.forRoot({}),

    // 추가 모듈
    HealthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
