import { AuthType, ToolBackendPayload } from '@/guards/guard.type';
import { Inject, Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
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
import { CodeeditorRepository } from '@/infra/memory/tool';

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
  private readonly logger = new Logger();

  constructor(
    private readonly codeeditorService: CodeeditorService,
    private readonly kafkaService: KafkaService,
    private readonly codeeditorRepo: CodeeditorRepository,
    @Inject(CODEEDITOR_WEBSOCKET) private readonly codeeditorSocket: CodeeditorWebsocket,
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
    const payload: ToolBackendPayload = client.data.payload;
    if (!payload) {
      client.disconnect(true);
      return;
    }
    const roomName = this.codeeditorService.makeNamespace(payload.room_id); // 방가입
    await client.join(roomName);
    client.data.roomName = roomName;

    // 메모리에 존재하면 가져오고 없으면 cache에서 가져온다.
    const doc = this.codeeditorRepo.get(roomName);
    if (doc) {
      this.logger.log(`[Sync] 서버에서 신규 유저 ${payload.user_id}에게 직접 데이터 전송`);
      const fullUpdate = Y.encodeStateAsUpdate(doc);
      client.emit('yjs-update', fullUpdate); // 방 전체가 아닌 '나'에게만 전송
    } else {
      // 아무도 없어서 Doc이 없다면, 다른 사람에게 요청 (최초 생성 시나리오)
      client.to(roomName).emit('request-sync');
    }

    if (payload.clientType === 'main') {
      this.kafkaService.emit(EVENT_STREAM_NAME.CODEEDITOR_ENTER, {
        room_id: payload.room_id,
        user_id: payload.user_id,
        tool: payload.tool,
        socket_id: payload.socket_id,
        ticket: payload.ticket,
        at: Date.now(), // 현재 보낸 시간
      });
    }

    client.emit(CODEEDITOR_CLIENT_EVENT_NAME.PERMISSION, { ok: true });
  }

  async handleDisconnect(client: Socket) {
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

  @SubscribeMessage('yjs-update')
  handleYjsUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() update: Buffer, // Yjs 데이터는 바이너리
  ) {
    try {
      if (!update) return;

      // 캐싱된 룸 이름 사용
      const roomName = client.data.roomName;

      let doc = this.codeeditorRepo.get(roomName);
      if (!doc) {
        doc = new Y.Doc();
        this.codeeditorRepo.set(roomName, doc);
      }

      Y.applyUpdate(doc, new Uint8Array(update));

      // 브로드캐스트
      client.to(roomName).volatile.emit('yjs-update', update);
    } catch (error) {
      this.logger.error(`Yjs Update Error: ${error.message}`);
    }
  }

  @SubscribeMessage('request-sync')
  handleRequestSync(@ConnectedSocket() client: Socket) {
    const roomName = client.data.roomName;
    const doc = this.codeeditorRepo.get(roomName);

    if (!doc) return;

    const fullUpdate = Y.encodeStateAsUpdate(doc);
    client.emit('yjs-update', fullUpdate);

    this.logger.log('doc length', doc?.getText('monaco').length);
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
}
