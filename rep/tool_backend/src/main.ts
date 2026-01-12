import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config : ConfigService = app.get(ConfigService);

  // 기본 설정
  const port: number = config.get<number>('NODE_PORT', 8080);
  const host: string = config.get<string>('NODE_HOST', 'localhost');
  await app.listen(port, host);
}
bootstrap();
