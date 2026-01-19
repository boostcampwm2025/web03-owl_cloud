import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { RedisIoAdapter } from '@infra/channel/redis/channel.service';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { SASLOptions } from 'kafkajs';

async function bootstrap() {
  // 기본 설정
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // 웹소켓 adapter 설정
  const redisAdapter = new RedisIoAdapter(app, config);
  await redisAdapter.websocketConnectToRedis(); // websocket을 redis로 연결
  app.useWebSocketAdapter(redisAdapter);

  // kafka 설정 - consumers 설정
  const clientId: string = config.get<string>('NODE_APP_KAFKA_CLIENT_ID', 'client_id');
  const brokers: Array<string> = config
    .get<string>('NODE_APP_KAFKA_BROKERS', '127.0.0.1:9092')
    .split(',')
    .map((v) => v.trim());
  const groupId = config.get<string>('NODE_APP_KAFKA_GROUP_ID', 'groupid');

  // sasl
  const saslMechanism = config.get<string>(
    'NODE_APP_KAFKA_SASL_MECHANISM',
    'scram-sha-256',
  ) as 'scram-sha-256'; // 가장 보안적으로 않좋다.
  // ssl에 쓰이는 이름
  const username: string = config.get<string>('NODE_APP_KAFKA_SASL_USERNAME', 'main-user');
  const password: string = config.get<string>('NODE_APP_KAFKA_SASL_PASSWORD', 'password');
  // ssl 사용
  const sslEnabled: boolean = config.get<string>('NODE_APP_KAFKA_SSL_ENABLED', 'false') === 'true';

  // 구독한 topic에서 받는 것에 대한 설정
  const sasl: SASLOptions = { mechanism: saslMechanism, username, password };

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId,
        brokers,
        ssl: sslEnabled,
        ...(sasl ? { sasl } : {}),
      },
      consumer: { groupId },
      subscribe: { fromBeginning: config.get<string>('NODE_ENV', 'deployment') === 'deployment' }, // 현재 시점 이후에만 읽겠다는 뜻이다. ( 개발에서는 그래도 된다. )
    },
  });
  await app.startAllMicroservices(); // 실제 실행

  // cors 설정
  const origin: Array<string> = config
    .get<string>('NODE_ALLOWED_ORIGIN', 'http://localhost:3000')
    .split(',')
    .map((host: string) => host.trim());

  const methods: Array<string> = config
    .get<string>('NODE_ALLOWED_METHODS', 'GET,POST')
    .split(',')
    .map((method: string) => method.trim());

  const allowedHeaders: Array<string> = config
    .get<string>('NODE_ALLOWED_HEADERS', 'Content-Type, Accept, Authorization')
    .split(',')
    .map((header: string) => header.trim());

  const credentials: boolean =
    config.get<string>('NODE_ALLOWED_CREDENTIALS', 'false').trim() === 'true';

  const exposedHeaders: Array<string> = config
    .get<string>('NODE_ALLOWED_EXPOSE_HEADERS', '')
    .split(',')
    .map((header: string) => header.trim());

  app.enableCors({
    origin,
    methods,
    allowedHeaders,
    credentials,
    exposedHeaders,
  });

  // port, host 설정
  const port: number = config.get<number>('NODE_PORT', 8080);
  const host: string = config.get<string>('NODE_HOST', 'localhost');

  // 종료 훅을 반드시 호출해 달라는 함수이다.
  app.enableShutdownHooks();

  // app에 들어오는 global prefix는
  const prefix: string = config.get<string>('NODE_BACKEND_PREFIX', 'api');
  app.setGlobalPrefix(prefix);

  await app.listen(port, host);
}
bootstrap();
