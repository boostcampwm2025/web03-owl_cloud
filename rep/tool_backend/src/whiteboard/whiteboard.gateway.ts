import { AuthType, ToolBackendPayload } from '@/guards/guard.type';
import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import {
  WHITEBOARD_CLIENT_EVENT_NAME,
  WHITEBOARD_EVENT_NAME,
  WHITEBOARD_GROUP,
} from './whiteboard.constants';
import { WhiteboardService } from './whiteboard.service';
import { KafkaService } from '@/infra/event-stream/kafka/event-stream.service';
import { EVENT_STREAM_NAME } from '@/infra/event-stream/event-stream.constants';
import { WhiteboardWebsocket } from '@/infra/websocket/whiteboard/whiteboard.service';

// 아래쪽에 whiteboard 관련 @Submessage를 붙이셔서 해주시면 될것 같아요 ㅎㅎ
@WebSocketGateway({
  namespace: process.env.NODE_BACKEND_WEBSOCKET_PREFIX,
  path: process.env.NODE_BACKEND_WEBSOCKET_WHITEBOARD, // http 핸드세이킹이 있을때 붙게 되는
  cors: {
    origin: process.env.NODE_ALLOWED_ORIGIN?.split(',').map((origin) => origin.trim()),
    credentials: process.env.NODE_ALLOWED_CREDENTIALS === 'true',
  },
  transports: ['websocket'],
  pingTimeout: 20 * 1000, // ping pong 허용 시간 ( 20초 )
})
export class WhiteboardWebsocketGateway implements OnGatewayInit, OnGatewayConnection {
  @WebSocketServer()
  private readonly server: Server;

  private readonly logger = new Logger();

  constructor(
    private readonly whiteboarService: WhiteboardService,
    private readonly kafkaService: KafkaService,
    private readonly whiteboardSocket: WhiteboardWebsocket,
  ) {}

  // 연결을 했을때
  afterInit(server: Server): void {
    this.whiteboardSocket.bindServer(server);

    server.use(async (socket, next) => {
      try {
        const { token, type } = socket.handshake.auth as AuthType;

        if (!token) return next(new Error('TOKEN_REQUIRED'));
        if (type !== 'main' && type !== 'sub') return next(new Error('INVALID_TYPE'));

        const payload = await this.whiteboarService.guardService(token, type);

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

    // 방 입장후 알림
    const namespace: string = this.whiteboarService.makeNamespace(payload.room_id); // 방가입
    client.join(namespace);

    if (payload.clientType === 'main') {
      this.kafkaService.emit(EVENT_STREAM_NAME.WHITEBOARD_ENTER, {
        room_id: payload.room_id,
        user_id: payload.user_id,
        tool: payload.tool,
        socket_id: payload.socket_id,
        ticket: payload.ticket,
        at: Date.now(), // 현재 보낸 시간
      });
    }

    client.emit(WHITEBOARD_CLIENT_EVENT_NAME.PERMISSION, { ok: true });
  }

  @SubscribeMessage(WHITEBOARD_EVENT_NAME.HEALTH_CHECK)
  healthCheck(
    // broad casting 방법은 client.to().emit()하시면 됩니다. 이때 namespace는 this.whiteboarService.makeNamespace(room_Id)로 나온 값입니다.
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
}
