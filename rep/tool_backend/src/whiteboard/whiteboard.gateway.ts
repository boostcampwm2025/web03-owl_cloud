import { AuthType, ToolBackendPayload } from '@/guards/guard.type';
import { Inject, Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WHITEBOARD_CLIENT_EVENT_NAME, WHITEBOARD_EVENT_NAME } from './whiteboard.constants';
import { WhiteboardService } from './whiteboard.service';
import { KafkaService } from '@/infra/event-stream/kafka/event-stream.service';
import { EVENT_STREAM_NAME } from '@/infra/event-stream/event-stream.constants';
import { WHITEBOARD_WEBSOCKET } from '@/infra/websocket/websocket.constants';
import { WhiteboardWebsocket } from '@/infra/websocket/whiteboard/whiteboard.service';
import { WhiteboardRepository } from '@/infra/memory/tool';

@WebSocketGateway({
  namespace: process.env.NODE_BACKEND_WEBSOCKET_WHITEBOARD,
  path: process.env.NODE_BACKEND_WEBSOCKET_PREFIX,
  cors: {
    origin: process.env.NODE_ALLOWED_ORIGIN?.split(',').map((origin) => origin.trim()),
    credentials: process.env.NODE_ALLOWED_CREDENTIALS === 'true',
  },
  transports: ['websocket'],
  pingTimeout: 20 * 1000,
  maxHttpBufferSize: 10 * 1024 * 1024,
})
export class WhiteboardWebsocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(WhiteboardWebsocketGateway.name);

  constructor(
    private readonly whiteboardService: WhiteboardService,
    private readonly kafkaService: KafkaService,
    private readonly whiteboardRepo: WhiteboardRepository,
    @Inject(WHITEBOARD_WEBSOCKET) private readonly whiteboardSocket: WhiteboardWebsocket,
  ) {}

  // 초기화 및 인증 미들웨어
  // 서버 시작 시 WhiteboardWebsocketGateway가 초기화됨
  // afterInit 메서드 실행되어 인증 미들웨어 등록(server.use) -> NestJs의 웹 소켓 생명주기 훅(소켓서버 초기에 한번만 실행)
  // 모든 소켓 요청이 통과해야 하는 미들웨어
  afterInit(server: Server): void {
    this.whiteboardSocket.bindServer(server);

    server.use(async (socket, next) => {
      try {
        // 클라이언트가 보낸 데이터 확인
        const { token, type } = socket.handshake.auth as AuthType;

        // 검사 구간
        // 토큰이 없거나 클라이언트 타입이 이상하면 next(Error) 호출
        if (!token) return next(new Error('TOKEN_REQUIRED'));
        if (type !== 'main' && type !== 'sub') return next(new Error('INVALID_TYPE'));

        // 인증 서비스 호출(guardService)
        // 유효 토큰 확인
        const payload = await this.whiteboardService.guardService(token, type);

        // 인증 통과 시 소켓 데이터에 페이로드 추가
        socket.data.payload = payload;
        this.logger.log('화이트보드 웹소켓 준비되었습니다.');
        return next();
      } catch (err) {
        this.logger.error(err);
        next(new Error('인증 에러'));
      }
    });
  }

  // 연결 성공 후 방에 입장하는 과정
  // 시점: afterInit의 미들웨어(next())가 성공적으로 호출된 직후 실행
  // 역할: 소켓을 특정 그룹(Room)에 넣고 필요한 초기 설정과 로그 작성
  async handleConnection(client: Socket) {
    const payload: ToolBackendPayload = client.data.payload;
    if (!payload) {
      client.disconnect(true);
      return;
    }

    const roomName = this.whiteboardService.makeNamespace(payload.room_id);
    client.join(roomName);
    client.data.roomName = roomName;

    // Kafka 이벤트 발행(로그,동기화)
    if (payload.clientType === 'main') {
      this.kafkaService.emit(EVENT_STREAM_NAME.WHITEBOARD_ENTER, {
        room_id: payload.room_id,
        user_id: payload.user_id,
        tool: payload.tool,
        socket_id: payload.socket_id,
        ticket: payload.ticket,
        at: Date.now(),
      });
    }

    // 입장 허가 메시지 전송
    client.emit(WHITEBOARD_CLIENT_EVENT_NAME.PERMISSION, { ok: true });
    client.emit('init-user', { userId: payload.user_id });
  }

  // 연결 해제 처리
  handleDisconnect(client: Socket) {
    const payload: ToolBackendPayload = client.data.payload;
    const roomName = client.data.roomName;

    if (!payload || !roomName) return;

    this.logger.log(`[Disconnect] User ${payload.user_id} left ${roomName}`);

    client.to(roomName).emit('user-disconnected', { userId: payload.user_id });
  }

  // 헬스 체크
  @SubscribeMessage(WHITEBOARD_EVENT_NAME.HEALTH_CHECK)
  healthCheck(@ConnectedSocket() client: Socket) {
    try {
      const payload: ToolBackendPayload = client.data.payload;
      this.logger.log('Health Check:', payload);
      return { ok: true };
    } catch (err) {
      this.logger.error(err);
      throw new WsException({ message: err.message ?? '에러 발생', status: err.status ?? 500 });
    }
  }

  // 준비가 돼었을때를 위한 ready
  @SubscribeMessage(WHITEBOARD_EVENT_NAME.CLIENT_READY)
  async onReady(@ConnectedSocket() client: Socket) {
    try {
      const payload: ToolBackendPayload = client.data.payload;
      const full = await this.whiteboardService.ensureDocFromRedis(payload.room_id);

      client.emit('yjs-init', {
        update: Buffer.from(full.update),
        seq: full.seq,
        origin: 'INIT',
      });
    } catch (err) {
      this.logger.error(err);
      throw new WsException({ message: err.message ?? 'READY_ERROR', status: 500 });
    }
  }

  // Yjs 업데이트 (아이템 동기화) -> 이부분에서 동기화를 진행하는것 같다 여기서도 만약 문제가 발생하면 다시 싱크를 맞추는 작업이 필요해 보인다.
  // source of trutch로 도메인에서 업데이트 하기 전에 여기를 거쳐야 한다.
  @SubscribeMessage('yjs-update')
  handleYjsUpdate(@ConnectedSocket() client: Socket, @MessageBody() update: Buffer) {
    try {
      if (!update || update.length === 0) return;
      const payload: ToolBackendPayload = client.data.payload;
      const roomName = client.data.roomName;

      // whiteboard 레포에 증분을 업데이트 한다.
      const u8 = new Uint8Array(update);
      const seq = this.whiteboardRepo.applyAndAppendUpdate(payload.room_id, u8);

      // 서버에 저장 하기 전에 queue에 올린다.
      this.whiteboardService.queueUpdates(payload.room_id, [u8], payload.user_id);

      // 브로드캐스트 이러한 방식을 이용해서 이를 업데이트 한다.
      client.to(roomName).volatile.emit('yjs-update', {
        update,
        seq,
      });
    } catch (error) {
      this.logger.error(`Yjs Update Error: ${error.message}`);
    }
  }

  // 동기화 요청 처리 ( 도메인 수정이나 비슷한 상황에서 동기화가 필요할때 사용한다.  )
  @SubscribeMessage('request-sync')
  handleRequestSync(@ConnectedSocket() client: Socket, @MessageBody() body: { last_seq?: number }) {
    try {
      const payload: ToolBackendPayload = client.data.payload;

      const room_id = payload.room_id;
      const last_seq = Number(body?.last_seq ?? 0);

      // 증분을 시도한다.
      const updates = this.whiteboardRepo.getUpdatesSince(room_id, last_seq);

      if (updates === null) {
        const full = this.whiteboardRepo.encodeFull(room_id);
        client.emit('yjs-sync-full', {
          update: Buffer.from(full.update),
          seq: full.seq,
          origin: 'FULL',
        });
        this.logger.log(`[Sync] FULL: room=${room_id} last_seq=${last_seq} -> seq=${full.seq}`);
        return;
      } // update 부분이 없다면 스킵

      if (updates.length === 0) {
        const entry = this.whiteboardRepo.ensure(room_id);
        client.emit('yjs-sync-ok', { ok: true, seq: entry.seq });
        return;
      }

      const entry = this.whiteboardRepo.ensure(room_id);
      client.emit('yjs-sync-delta', {
        from: last_seq,
        to: entry.seq,
        updates: updates.map((u) => Buffer.from(u.update)),
        origin: 'DELTA',
      });

      this.logger.log(
        `[Sync] DELTA: room=${room_id} from=${last_seq} to=${entry.seq} count=${updates.length}`,
      );
    } catch (err) {
      this.logger.error(`Request Sync Error: ${err.message}`);
    }
  }

  // Awareness 업데이트 (커서 위치, 선택 아이템 동기화)
  @SubscribeMessage('awareness-update')
  handleAwarenessUpdate(@ConnectedSocket() client: Socket, @MessageBody() update: Buffer) {
    try {
      if (!update) return;

      client.to(client.data.roomName).volatile.emit('awareness-update', update);
    } catch (error) {
      this.logger.error(`Awareness Update Error: ${error.message}`);
    }
  }

  @SubscribeMessage(WHITEBOARD_EVENT_NAME.DISCONNECT_WHITEBOARD)
  disconnectWhiteboard(@ConnectedSocket() client: Socket) {
    try {
      this.whiteboardSocket.disconnectWhiteboardRoom(client.data.payload.room_id);
    } catch (err) {
      this.logger.error(`Whiteboard Disconnect Error : ${err}`);
    }
  }

  // 요소 생성
  @SubscribeMessage(WHITEBOARD_EVENT_NAME.CREATE_ELEMENT)
  handleCreate(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
    try {
      const roomName = client.data.roomName;
      // 현재 인덱스 확인 후 동기화 작업 진행 (다른것도 마찬가지이다.)

      // 맞으면 뿌리고 업데이트

      client.to(roomName).emit(WHITEBOARD_CLIENT_EVENT_NAME.REMOTE_CREATE_ELEMENT, data);
    } catch (error) {
      this.logger.error(`Create Error: ${error.message}`);
    }
  }

  // 요소 수정
  @SubscribeMessage(WHITEBOARD_EVENT_NAME.UPDATE_ELEMENT)
  handleUpdate(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
    try {
      const roomName = client.data.roomName;
      client.to(roomName).emit(WHITEBOARD_CLIENT_EVENT_NAME.REMOTE_UPDATE_ELEMENT, data);
    } catch (error) {
      this.logger.error(`Update Error: ${error.message}`);
    }
  }

  // 요소 삭제
  @SubscribeMessage(WHITEBOARD_EVENT_NAME.DELETE_ELEMENT)
  handleDelete(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
    try {
      const roomName = client.data.roomName;
      client.to(roomName).emit(WHITEBOARD_CLIENT_EVENT_NAME.REMOTE_DELETE_ELEMENT, data);
    } catch (error) {
      this.logger.error(`Delete Error: ${error.message}`);
    }
  }

  // 레이어 변경
  @SubscribeMessage(WHITEBOARD_EVENT_NAME.CHANGE_LAYER)
  handleLayer(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
    try {
      const roomName = client.data.roomName;
      client.to(roomName).emit(WHITEBOARD_CLIENT_EVENT_NAME.REMOTE_CHANGE_LAYER, data);
    } catch (error) {
      this.logger.error(`Layer Error: ${error.message}`);
    }
  }
}
