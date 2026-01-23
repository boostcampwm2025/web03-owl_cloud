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
import { WHITEBOARD_CLIENT_EVENT_NAME, WHITEBOARD_EVENT_NAME } from './whiteboard.constants';
import { WhiteboardService } from './whiteboard.service';
import { KafkaService } from '@/infra/event-stream/kafka/event-stream.service';
import { EVENT_STREAM_NAME } from '@/infra/event-stream/event-stream.constants';
import { WHITEBOARD_WEBSOCKET } from '@/infra/websocket/websocket.constants';
import { WhiteboardWebsocket } from '@/infra/websocket/whiteboard/whiteboard.service';

@WebSocketGateway({
  namespace: process.env.NODE_BACKEND_WEBSOCKET_WHITEBOARD,
  path: process.env.NODE_BACKEND_WEBSOCKET_PREFIX,
  cors: {
    origin: process.env.NODE_ALLOWED_ORIGIN?.split(',').map((origin) => origin.trim()),
    credentials: process.env.NODE_ALLOWED_CREDENTIALS === 'true',
  },
  transports: ['websocket'],
  pingTimeout: 20 * 1000,
})
export class WhiteboardWebsocketGateway implements OnGatewayInit, OnGatewayConnection {
  @WebSocketServer()
  private readonly server: Server;

  private readonly logger = new Logger(WhiteboardWebsocketGateway.name);

  constructor(
    private readonly whiteboardService: WhiteboardService,
    private readonly kafkaService: KafkaService,
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

        // TODO : 여기 if 부분만 나중에 삭제하면 됨
        // 테스트용 임시 코드 -> 가짜 mock data 역할
        if (token === 'temp-ticket') {
          socket.data.payload = {
            user_id: `test-${socket.id}`,
            room_id: 'test-room',
            clientType: 'main',
            tool: 'whiteboard',
            socket_id: socket.id,
            ticket: token,
          };
          this.logger.log('[TEST] 웹소켓 인증 우회 접속');
          return next();
        }

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

    this.logger.log(`User가 ${roomName}에 참여함`);

    // Kafka 이벤트 발행(로그,동기화)
    if (payload.clientType === 'main' && payload.ticket !== 'temp-ticket') {
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

  // 요소 생성
  @SubscribeMessage(WHITEBOARD_EVENT_NAME.CREATE_ELEMENT)
  handleCreate(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
    try {
      const roomName = client.data.roomName;
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

  // 커서 이동
  @SubscribeMessage(WHITEBOARD_EVENT_NAME.CURSOR_MOVE)
  handleCursorMove(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
    try {
      const roomName = client.data.roomName;
      client.to(roomName).volatile.emit(WHITEBOARD_CLIENT_EVENT_NAME.REMOTE_CURSOR_MOVE, data);
    } catch (error) {
      this.logger.error(`Cursor Error: ${error.message}`);
    }
  }
}
