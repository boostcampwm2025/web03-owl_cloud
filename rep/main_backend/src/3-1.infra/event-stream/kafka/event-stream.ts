import { Global, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { KAFKA } from '../event-stream.constants';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SASLOptions } from 'kafkajs';
import { KafkaService } from './event-stream-service';

// kafka를 사용하기 위한 모듈
@Global()
@Module({
  imports: [
    // kafka 용도
    ClientsModule.registerAsync([
      {
        name: KAFKA, // 의존성 주입
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => {
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
          const sslEnabled: boolean =
            config.get<string>('NODE_APP_KAFKA_SSL_ENABLED', 'false') === 'true';

          // 구독한 topic에서 받는 것에 대한 설정
          const sasl: SASLOptions = { mechanism: saslMechanism, username, password };

          return {
            transport: Transport.KAFKA,
            options: {
              client: {
                clientId,
                brokers,
                ssl: sslEnabled,
                ...(sasl ? { sasl } : {}),
              },
              consumer: { groupId },
              subscribe: {
                fromBeginning: config.get<string>('NODE_ENV', 'deployment') === 'deployment',
              },
            },
          };
        },
      },
    ]),
  ],
  providers: [KafkaService],
  exports: [KafkaService],
})
export class KafkaModule {}
