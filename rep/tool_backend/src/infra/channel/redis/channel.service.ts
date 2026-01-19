import { INestApplicationContext, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { ServerOptions } from 'socket.io';
import { createClient, type RedisClientType } from 'redis';

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor!: ReturnType<typeof createAdapter>;
  private readonly logger = new Logger(RedisIoAdapter.name);

  private pub!: RedisClientType;
  private sub!: RedisClientType;

  // nest app에 context api를 받겠다는 의미
  constructor(
    app: INestApplicationContext,
    private readonly config: ConfigService,
  ) {
    super(app);
  }

  async websocketConnectToRedis(): Promise<void> {
    const url: string = this.config.get<string>('NODE_APP_REDIS_URL', 'redis://localhost:6379');
    const password: string = this.config.get<string>('NODE_APP_REDIS_PASSWORD', 'password');

    // 구독자와 producer의 설정
    this.pub = createClient({ url, password });
    this.sub = this.pub.duplicate();

    this.pub.on('error', (e) => this.logger.error('websocet에 pub 객체 에러', e));
    this.sub.on('error', (e) => this.logger.error('websocet에 sub 객체 에러', e));

    // 각 객체가 연결되기까지의 기다림
    await Promise.all([this.pub.connect(), this.sub.connect()]);

    // 실질적으로 생성되었다.
    this.adapterConstructor = createAdapter(this.pub, this.sub);
    this.logger.log('websocket adapter가 생성되었습니다.');
  }

  // server가 실제로 io를 생성할때 사용하는 함수
  createIOServer(port: number, options?: ServerOptions) {
    const server = super.createIOServer(port, options);

    if (!this.adapterConstructor) throw new Error('redis를 이용한 adapter가 없습니다.');

    server.adapter(this.adapterConstructor);
    return server;
  }

  // 이 channel이 내려가면 redis를 내려야 한다.
  async close(): Promise<void> {
    // 에러가 발생했을때 좀 더 안전하게 내리기 위해서
    await Promise.allSettled([
      this.pub?.quit().catch(() => this.pub?.disconnect()),
      this.sub?.quit().catch(() => this.sub?.disconnect()),
    ]);
  }
}
