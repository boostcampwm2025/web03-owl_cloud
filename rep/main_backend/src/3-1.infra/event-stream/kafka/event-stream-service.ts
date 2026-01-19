import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { KAFKA } from '../event-stream.constants';
import { ClientKafka } from '@nestjs/microservices';

// 필요한 이유는 KAFKA가 module로 임포트 했기 때문이다.
@Injectable()
export class KafkaService implements OnModuleInit {
  constructor(@Inject(KAFKA) private readonly kafkaClient: ClientKafka) {}

  // 첫 module이 빌드될때 확실하게 kafka를 연결한다.
  async onModuleInit() {
    await this.kafkaClient.connect();
  }

  // emit topic, payload를 보냄 - 보내고 잊어도 됨 ( 일단 observable이 붙기는 한다. )
  emit<T = any>(topic: string, payload: T) {
    return this.kafkaClient.emit(topic, payload);
  }

  // send는 생성 하지 않을 예정 -> 이유는 consumers에서 처리할 것이기 때문이다.
}
