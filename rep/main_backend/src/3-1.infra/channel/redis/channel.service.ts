import {
  INestApplicationContext,
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';
import { createClient, type RedisClientType } from 'redis';
import { REDIS_CHANNEL_PUB, REDIS_CHANNEL_SUB, SsePayload } from '../channel.constants';
import { filter, map, Observable, share, Subject } from 'rxjs';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { ConfigService } from '@nestjs/config';
import { ServerOptions } from 'socket.io';

// sse와 관련된 service
@Injectable()
export class RedisSseBrokerService implements OnModuleDestroy {
  // observable로 가져오고 next로 밀어넣을 수 있다.
  private readonly subject = new Subject<{ channel: string; payload: SsePayload }>();

  // 모두가 같은 방에서는 같은 값을 공유하도록 한다.
  private readonly events$ = this.subject.asObservable().pipe(share()); // 추후 확장을 위해 pipe로 묶는다.

  // 사용하는 유저가 있을때만 방이 유지되도록 하려고 한다.
  private readonly channelCount = new Map<string, number>(); // channel : 인원

  constructor(
    @Inject(REDIS_CHANNEL_PUB) private readonly pub: RedisClientType,
    @Inject(REDIS_CHANNEL_SUB) private readonly sub: RedisClientType,
  ) {}

  // 구독을 했을때 발생하는 시나리오
  async subscribe(channel: string): Promise<void> {
    // 해당 방이 있는지 아니면 없는지 조사하는 로직
    const count: number = this.channelCount.get(channel) ?? 0; // undefiend, null이면 0
    this.channelCount.set(channel, count + 1); // 해당 값에 +1을 다시 세팅한다.

    if (count > 0) return;

    await this.sub.subscribe(channel, (message) => {
      try {
        // message를 검사하는 타입도 존제하면 좋을것 같다.

        //1. subscribe에 해당 channel에서 받은 message를 밀어 넣는다.
        this.subject.next({
          channel,
          payload: JSON.parse(message),
        });
      } catch (err) {
        // 나중에 logger로 확인해야 할 것 같다.
        console.error('[reids subscribe error]', err);
      }
    });
  }

  // 채널 삭제 검사
  async release(channel: string): Promise<void> {
    const count: number | undefined = this.channelCount.get(channel);
    if (!count) return;

    // 마지막 유저가 나가는 거라면 해당 채널을 삭제하고 정리한다.
    if (count === 1) {
      this.channelCount.delete(channel);
      await this.sub.unsubscribe(channel);
      return;
    }

    // 그게 아니라면 유저 수만 감소한다.
    this.channelCount.set(channel, count - 1);
  }

  // 구독 채널에 전송
  async publish(channel: string, payload: SsePayload) {
    await this.pub.publish(channel, JSON.stringify(payload));
  }

  // 해당 subject를 받을 수 있다.
  onChannel(channel: string): Observable<SsePayload> {
    return this.events$.pipe(
      filter((e) => e.channel === channel),
      map((e) => e.payload),
    );
  }

  // module이 없어지면 모든 구독을 해제해야 한다.
  async onModuleDestroy() {
    const channels: Array<string> = Array.from(this.channelCount.keys()); // 모든 채널 이름

    await Promise.allSettled(channels.map((ch) => this.sub.unsubscribe(ch))); // 구독 취소

    this.channelCount.clear(); // 모든 데이터 정리

    this.subject.complete(); // 모든 스트림을 종료
  }
}

// websocket에 adapter 역할을 redis가 대신 하도록 설정
export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor!: ReturnType<typeof createAdapter>;
  private readonly logger = new Logger(RedisIoAdapter.name);

  // 기존의 sse에 pub, sub을 사용할 수도 있지만 그러면 sse랑 겹칠 수 있기때문에 websocket용으로 따로 pub, sub을 만드는 것이 안전
  private pub!: RedisClientType;
  private sub!: RedisClientType;

  constructor(
    app: INestApplicationContext,
    private readonly config: ConfigService,
  ) {
    // nestapp에 http를 가져오겠다는 말
    super(app);
  }

  // websocket으로 redis를 사용
  async websocketConnectToRedis(): Promise<void> {
    const url: string = this.config.get<string>('NODE_APP_REDIS_URL', 'redis://localhost:6379'); // 이건 다른데 할까 고민도 했다.
    const password: string = this.config.get<string>('NODE_APP_REDIS_PASSWORD', 'password');

    this.pub = createClient({ url, password });
    this.sub = this.pub.duplicate();

    this.pub.on('error', (e) => this.logger.error('websocet에 pub 객체 에러', e));
    this.sub.on('error', (e) => this.logger.error('websocet에 sub 객체 에러', e));

    await Promise.all([this.pub.connect(), this.sub.connect()]); // 모든 pub, sub이 연결되기 위해서

    this.adapterConstructor = createAdapter(this.pub, this.sub);
    this.logger.log('websocket adapter가 생성되었습니다.');
  }

  // server가 io를 생성할때 사용되는 함수
  createIOServer(port: number, options?: ServerOptions) {
    const server = super.createIOServer(port, options); // 원래 server에 adapter를 가져와서

    // 만약 constructor가 없을때는 에러를 내야 한다.
    if (!this.adapterConstructor) throw new Error('redis를 이용한 adapter가 없습니다.');

    server.adapter(this.adapterConstructor);
    return server;
  }

  // reids가 내려갈때 사용되어 지는 함수 ( 해당 channel을 제대로 내리는 것이 중요하다. )
  // 모두 실행하는게 중요함으로 중간에 실패해도 모두 실행되도록 해야 함
  async close(): Promise<void> {
    await Promise.allSettled([
      this.pub?.quit().catch(() => this.pub?.disconnect()),
      this.sub?.quit().catch(() => this.sub?.disconnect()),
    ]);
  }
}
