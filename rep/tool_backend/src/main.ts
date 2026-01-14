import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config : ConfigService = app.get(ConfigService);

  // cors 설정
  const origin : Array<string> = config
  .get<string>("NODE_ALLOWED_ORIGIN", "http://localhost:3000")
  .split(",")
  .map((host : string) => host.trim());

  const methods : Array<string> = config
  .get<string>("NODE_ALLOWED_METHODS" ,"GET,POST")
  .split(",")
  .map((method : string) => method.trim());

  const allowedHeaders : Array<string> = config
  .get<string>("NODE_ALLOWED_HEADERS", "Content-Type, Accept, Authorization")
  .split(",")
  .map((header : string) => header.trim());

  const credentials : boolean = config
  .get<string>("NODE_ALLOWED_CREDENTIALS", "false").trim() === "true"

  app.enableCors({
    origin, methods, allowedHeaders, credentials
  });

  // 기본 설정
  const port: number = config.get<number>('NODE_PORT', 8080);
  const host: string = config.get<string>('NODE_HOST', 'localhost');

  // 기본 prefix 설정
  const prefix : string = config.get<string>("NODE_BACKEND_PREFIX", "tool");
  app.setGlobalPrefix(prefix);

  await app.listen(port, host);
}
bootstrap();
