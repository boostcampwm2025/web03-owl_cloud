import { AuthType, ToolBackendPayload } from '@/guards/guard.type';
import { Inject, Logger } from '@nestjs/common';
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

const mockData: ToolBackendPayload = {
  user_id: 'user1',
  room_id: 'user2',
  tool: 'codeeditor',
  socket_id: 'socket1',
  ticket: 'ticket',
  clientType: 'main',
  // nickname: 'test_user',
};

@WebSocketGateway({
  namespace: process.env.NODE_BACKEND_WEBSOCKET_PREFIX,
  path: process.env.NODE_BACKEND_WEBSOCKET_CODEEDITOR, // http 핸드세이킹이 있을때 붙게 되는
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
    // private readonly kafkaService: KafkaService,
    @Inject(CODEEDITOR_WEBSOCKET) private readonly codeeditorSocket: CodeeditorWebsocket,
  ) {}

  // 연결을 했을때
  afterInit(server: Server): void {
    this.codeeditorSocket.bindServer(server);

    server.use(async (socket, next) => {
      socket.data.payload = mockData;
      this.logger.log('웹소켓 준비되었습니다.');
      return next();
      // try {
      //   const { token, type } = socket.handshake.auth as AuthType;

      //   if (!token) return next(new Error('TOKEN_REQUIRED'));
      //   if (type !== 'main' && type !== 'sub') return next(new Error('INVALID_TYPE'));

      //   const payload = await this.whiteboarService.guardService(token, type);

      //   // data 추가
      //   socket.data.payload = payload;
      //   this.logger.log('웹소켓 준비되었습니다.');
      //   return next();
      // } catch (err) {
      //   this.logger.error(err);
      //   next(new Error('인증 에러'));
      // }
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
    client.join(roomName);

    client.data.roomName = roomName;

    client.emit('init-user', {
      userId: payload.user_id,
    });

    // 방에 이미 사람이 있다면, 그중 한 명에게 최신 상태(Sync Step)를 요청
    client.to(roomName).emit('request-sync');

    // if (payload.clientType === 'main') {
    //   this.kafkaService.emit(EVENT_STREAM_NAME.CODEEDITOR_ENTER, {
    //     room_id: payload.room_id,
    //     user_id: payload.user_id,
    //     tool: payload.tool,
    //     socket_id: payload.socket_id,
    //     ticket: payload.ticket,
    //     at: Date.now(), // 현재 보낸 시간
    //   });
    // }

    client.emit(CODEEDITOR_CLIENT_EVENT_NAME.PERMISSION, { ok: true });
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
      if (!update || update.length === 0) return;

      // 캐싱된 룸 이름 사용
      const roomName = client.data.roomName;

      // 브로드캐스트
      // volatile을 붙이면 전송 실패 시 재시도하지 않아 실시간 성능에 유리
      client.to(roomName).volatile.emit('yjs-update', update);
    } catch (error) {
      this.logger.error(`Yjs Update Error: ${error.message}`);
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
}
