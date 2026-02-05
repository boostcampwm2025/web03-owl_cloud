import { AuthType, ToolBackendPayload } from '@/guards/guard.type';
import { Inject, Logger, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { CODEEDITOR_CLIENT_EVENT_NAME, CODEEDITOR_EVENT_NAME } from './codeeditor.constants';
import { CodeeditorService } from './codeeditor.service';
import { KafkaService } from '@/infra/event-stream/kafka/event-stream.service';
import { EVENT_STREAM_NAME } from '@/infra/event-stream/event-stream.constants';
import { CODEEDITOR_WEBSOCKET } from '@/infra/websocket/websocket.constants';
import { CodeeditorWebsocket } from '@/infra/websocket/codeeditor/codeeditor.service';
import * as Y from 'yjs';
import {
  CodeeditorRepository,
  YjsSyncReqPayload,
  YjsSyncServerPayload,
  YjsUpdateClientPayload,
} from '@/infra/memory/tool';
import { PrometheusService } from '@/infra/metric/prometheus/prometheus.service';
import { WsMetricsInterceptor } from '@/infra/metric/prometheus/prometheus.intercepter';


@UseInterceptors(WsMetricsInterceptor)
@WebSocketGateway({
  namespace: process.env.NODE_BACKEND_WEBSOCKET_CODEEDITOR,
  path: process.env.NODE_BACKEND_WEBSOCKET_PREFIX,
  cors: {
    origin: process.env.NODE_ALLOWED_ORIGIN?.split(',').map((origin) => origin.trim()),
    credentials: process.env.NODE_ALLOWED_CREDENTIALS === 'true',
  },
  transports: ['websocket'],
  pingTimeout: 20 * 1000, // ping pong 허용 시간 ( 20초 )
})
export class CodeeditorWebsocketGateway implements OnGatewayInit, OnGatewayConnection {
  @WebSocketServer()
  private readonly server: Server;

  private readonly logger = new Logger();

  constructor(
    private readonly codeeditorService: CodeeditorService,
    private readonly kafkaService: KafkaService,
    private readonly codeeditorRepo: CodeeditorRepository,
    @Inject(CODEEDITOR_WEBSOCKET) private readonly codeeditorSocket: CodeeditorWebsocket,
    private readonly prom : PrometheusService
  ) {}

  // 연결을 했을때
  afterInit(server: Server): void {
    this.codeeditorSocket.bindServer(server);

    server.use(async (socket, next) => {
      try {
        const { token, type } = socket.handshake.auth as AuthType;

        if (!token) return next(new Error('TOKEN_REQUIRED'));
        if (type !== 'main' && type !== 'sub') return next(new Error('INVALID_TYPE'));

        const payload = await this.codeeditorService.guardService(token, type);

        // data 추가
        socket.data.payload = payload;
        this.logger.log('웹소켓 준비되었습니다.');
        return next();
      } catch (err) {
        this.logger.error(err);
        next(new Error('인증 에러'));
      }
    });
  }

  // 연결 완료 후
  async handleConnection(client: Socket) {
    const ns : string = client.nsp.name; // 여기서는 /signal이 될 예정이다.
    this.prom.wsConnectionsCurrent.labels(ns).inc();
    this.prom.wsConnectionsTotal.labels(ns).inc();
    
    const payload: ToolBackendPayload = client.data.payload;
    if (!payload) {
      client.disconnect(true);
      return;
    }
    const roomName = this.codeeditorService.makeNamespace(payload.room_id); // 방가입
    await client.join(roomName);
    client.data.roomName = roomName;

    if (payload.clientType === 'main') {
      // main이 불러오면 ydoc에 있는 캐시도 자동으로 불러오게 한다.

      this.kafkaService.emit(EVENT_STREAM_NAME.CODEEDITOR_ENTER, {
        room_id: payload.room_id,
        user_id: payload.user_id,
        tool: payload.tool,
        socket_id: payload.socket_id,
        ticket: payload.ticket,
        at: Date.now(), // 현재 보낸 시간
      });
    };

    client.emit(CODEEDITOR_CLIENT_EVENT_NAME.PERMISSION, { ok: true });
  }

  async handleDisconnect(client: Socket) {
    // 연결과 관련된 네임스페이스
    const ns = client.nsp.name;
    this.prom.wsConnectionsCurrent.labels(ns).dec();
    const reason =
      (client as any).disconnectReason ??          
      (client as any).conn?.closeReason ??         
      'unknown';
    this.prom.wsDisconnectsTotal.labels(ns, reason).inc();

    const roomName = client.data.roomName;
    if (!roomName) return;

    // TODO: 방에 아무도 없을 때 삭제
  }

  @SubscribeMessage(CODEEDITOR_EVENT_NAME.HEALTH_CHECK)
  healthCheck(
    //
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const payload: ToolBackendPayload = client.data.payload;
      this.logger.log('health체크중: ', payload);

      return { ok: true };
    } catch (err) {
      this.logger.error(err);
      throw new WsException({ message: err.message ?? '에러 발생', status: err.status ?? 500 });
    }
  }

  // 좀더 안전하게 하기 위한 ready
  @SubscribeMessage('yjs-ready')
  async onReady(@ConnectedSocket() client: Socket) {
    if (client.data.__yjsReadySent) return;
    client.data.__yjsReadySent = true;

    const payload: ToolBackendPayload = client.data.payload;
    const full = await this.codeeditorService.ensureDocFromRedis(payload.room_id);

    client.emit('yjs-init', {
      update: Buffer.from(full.update),
      seq: full.seq,
      origin: 'INIT',
    });
  }

  // 업데이트 하고 싶다고 보내는 메시지
  @SubscribeMessage('yjs-update')
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
    }),
  )
  async handleYjsUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: YjsUpdateClientPayload,
  ) {
    // 캐싱된 룸 이름 사용
    const roomName = client.data.roomName;
    const dataPayload: ToolBackendPayload = client.data.payload;

    try {
      const bufs = this.codeeditorService.normalizeToBuffers(payload);
      if (!bufs || bufs.length === 0) {
        client.emit('yjs-sync', {
          type: 'error',
          ok: false,
          code: 'BAD_PAYLOAD',
        } satisfies YjsSyncServerPayload);
        return;
      }

      // 클라이언트에 마지막 값과 비교
      const missed = this.codeeditorRepo.getUpdatesSince(dataPayload.room_id, payload.last_seq);

      if (missed === null) {
        // 뒤처지면 전체를 sync해서 보낸다. 그리고 업데이트를 하고 보내면 좋겠다. 그러니까 전체 추가 후 업데이트
        const full = this.codeeditorRepo.encodeFull(dataPayload.room_id);
        const msg: YjsSyncServerPayload = {
          type: 'full',
          ok: true,
          server_seq: full.seq,
          update: Buffer.from(full.update),
          origin: 'UPDATE_REJECTED',
        };
        client.emit('yjs-sync', msg); // 새롭게 전체 업데이트 한것 까지 추가해서 보내면 좋다.
        return;
      }

      if (missed.length > 0) {
        // 이것도 그냥 업데이트 하고 patch로 보내면 좋을것 같다.
        const msg: YjsSyncServerPayload = {
          type: 'patch',
          ok: true,
          from_seq: missed[0].seq,
          to_seq: missed[missed.length - 1].seq,
          updates: missed.map((u) => Buffer.from(u.update)),
          server_seq: this.codeeditorRepo.ensure(dataPayload.room_id).seq,
          origin: 'UPDATE_REJECTED',
        };
        client.emit('yjs-sync', msg);
        return;
      }

      let firstSeq: number | null = null;
      let lastSeq = payload.last_seq;

      const appliedUpdates: Buffer[] = [];
      for (const b of bufs) {
        const seq = this.codeeditorRepo.applyAndAppendUpdate(
          dataPayload.room_id,
          new Uint8Array(b),
        );
        if (firstSeq === null) firstSeq = seq;
        lastSeq = seq;
        appliedUpdates.push(b);
      }

      // ack에 경우는 마지막만
      client.emit('yjs-sync', {
        type: 'ack',
        ok: true,
        server_seq: lastSeq,
      } satisfies YjsSyncServerPayload);

      // 브로드캐스트: 단일/배치 둘 다 가능
      if (appliedUpdates.length === 1) {
        client.to(roomName).emit('yjs-update', { seq: lastSeq, update: appliedUpdates[0] });
      } else {
        client.to(roomName).emit('yjs-update', {
          from_seq: firstSeq!,
          to_seq: lastSeq,
          updates: appliedUpdates,
        });
      }

      // 모든 업데이트가 끝났을때 redis에 업데이트 한다.
      await this.codeeditorService.appendUpdatesToStream(
        dataPayload.room_id,
        appliedUpdates.map((b) => new Uint8Array(b)),
        dataPayload.user_id,
      );

      await this.codeeditorService.maybeSnapShot(dataPayload.room_id);
    } catch (error) {
      this.logger.error(`Yjs Update Error: ${error?.message ?? error}`);
      const msg: YjsSyncServerPayload = {
        type: 'error',
        ok: false,
        code: 'INTERNAL',
        message: error?.message,
      };
      client.emit('yjs-sync', msg);
    }
  }

  // update를 받았는데 싱크가 안맞을 경우 요청해야 한다.
  @SubscribeMessage('yjs-sync-req')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  handleYjsSyncReq(@ConnectedSocket() client: Socket, @MessageBody() payload: YjsSyncReqPayload) {
    const roomName = client.data.roomName;
    const dataPayload: ToolBackendPayload = client.data.payload;
    if (!roomName) return;

    try {
      const missed = this.codeeditorRepo.getUpdatesSince(dataPayload.room_id, payload.last_seq);

      if (missed === null) {
        const full = this.codeeditorRepo.encodeFull(dataPayload.room_id);
        const msg: YjsSyncServerPayload = {
          type: 'full',
          ok: true,
          server_seq: full.seq,
          update: Buffer.from(full.update),
          origin: 'SYNC_REQ',
        };
        client.emit('yjs-sync', msg);
        return;
      }

      if (missed.length > 0) {
        const msg: YjsSyncServerPayload = {
          type: 'patch',
          ok: true,
          from_seq: missed[0].seq,
          to_seq: missed[missed.length - 1].seq,
          updates: missed.map((u) => Buffer.from(u.update)),
          server_seq: this.codeeditorRepo.ensure(dataPayload.room_id).seq,
          origin: 'SYNC_REQ',
        };
        client.emit('yjs-sync', msg);
        return;
      }

      // 이미 최신이면 ack로 알려주기
      client.emit('yjs-sync', {
        type: 'ack',
        ok: true,
        server_seq: this.codeeditorRepo.ensure(dataPayload.room_id).seq,
        origin: 'SYNC_REQ',
      } satisfies YjsSyncServerPayload);
    } catch (error: any) {
      this.logger.error(`Yjs SyncReq Error: ${error?.message ?? error}`);
      const msg: YjsSyncServerPayload = {
        type: 'error',
        ok: false,
        code: 'INTERNAL',
        message: error?.message,
        origin: 'SYNC_REQ',
      };
      client.emit('yjs-sync', msg);
    }
  }

  @SubscribeMessage('awareness-update')
  handleAwarenessUpdate(@ConnectedSocket() client: Socket, @MessageBody() update: Buffer) {
    try {
      if (!update) return;

      client.to(client.data.roomName).volatile.emit('awareness-update', update);
    } catch (error) {
      this.logger.error(`Awareness Update Error: ${error.message}`);
    }
  }

  // 이 부분은 잠시 비활성화 할 예정입니다.
  // @SubscribeMessage('request-sync')
  // handleRequestSync(@ConnectedSocket() client: Socket) {
  //   const roomName = client.data.roomName;
  //   let doc = this.codeeditorRepo.get(roomName);

  //   if (!doc) {
  //     doc = new Y.Doc();
  //     this.codeeditorRepo.set(roomName, doc);
  //   };

  //   const fullUpdate = Y.encodeStateAsUpdate(doc);
  //   client.emit('yjs-update', fullUpdate);

  //   this.logger.log('doc length', doc?.getText('monaco').length);
  // }
}
