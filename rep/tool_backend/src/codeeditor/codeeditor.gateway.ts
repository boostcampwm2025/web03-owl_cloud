import { AuthType, ToolBackendPayload } from '@/guards/guard.type';
import { Inject, Logger, UsePipes, ValidationPipe } from '@nestjs/common';
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
import { CodeeditorRepository, YjsPullMessage, YjsRoomResult, YjsUpdateMessage } from '@/infra/memory/tool';


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
    private readonly codeeditorRepo : CodeeditorRepository,
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
    const entry = this.codeeditorRepo.ensure(roomName); // 일단 실험을 위해서 메모리로만 진행을 해보자

    // 그 업데이트 본을 준다. 
    const fullUpdate = Y.encodeStateAsUpdate(entry.doc);

    // 초기에 idx와 함께 같이 전달해준다. ( 현재 메모리에 저장된 idx )
    client.emit('yjs-init', { update: fullUpdate, idx: entry.idx }); 
    client.data.last_idx = entry.idx;

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

  // 업데이트 하고 싶다고 보내는 메시지
  @UsePipes(
  new ValidationPipe({
    whitelist : true,
    transform : true
  }))
  @SubscribeMessage('yjs-update')
  async handleYjsUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() updateMsg: YjsUpdateMessage, // Yjs 데이터는 바이너리
  ) {
    try {
      // 캐싱된 룸 이름 사용
      const roomName = client.data.roomName;
      const payload: ToolBackendPayload = client.data.payload;

      const entry = this.codeeditorRepo.ensure(roomName);

      // 안전하게 변환
      const updateBuf =
        Buffer.isBuffer(updateMsg.update)
          ? updateMsg.update
          : updateMsg.update instanceof Uint8Array
            ? Buffer.from(updateMsg.update)
            : Buffer.from(updateMsg.update);

      // prev_idx가 만약 entry.idx와 다르면 catchup 부터 시도하게 한다.
      if (updateMsg.prev_idx !== entry.idx) {
        // 클라가 가진 기준(prev_idx)부터 따라잡게 함
        await this.codeeditorService.catchUpForm(client, updateMsg.prev_idx);

        // 재전송 요구
        return;
      }
      const prevIdx = entry.idx;

      // 여기서 메모리 업데이트 + cache 업데이트를 진행해야 한다. 
      Y.applyUpdate(entry.doc, updateBuf);

      // redis 스트림에 업데이트 
      const { updateIdx } = await this.codeeditorService.appendUpdateLog({
        room_id: payload.room_id,       // room_id를 넣는다.
        prevIdx,
        update: updateBuf,
        user_id: payload.user_id,
      });

      // 메모리 idx에 갱신을 시킨다.
      entry.idx = updateIdx;

      const result: YjsRoomResult = {
        prev_idx: prevIdx,
        update_idx: updateIdx,
        update: updateBuf,
      };

      // 브로드캐스트 (이게 나를 제외하고 전부 보내는것인지 궁금)
      // code에 경우 최신성 보다는 정확성이 더 중요하다고 생각하기 때문에 이 부분에서 volatile을 삭제한다. 
      client.to(roomName).emit('yjs-update', result);

      client.data.last_idx = updateIdx;
    } catch (error) {
      this.logger.error(`Yjs Update Error: ${error.message}`);
    }
  };

  // 누락본 보내기 
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @SubscribeMessage('yjs-pull')
  async handleYjsPull(
    @ConnectedSocket() client: Socket,
    @MessageBody() msg: YjsPullMessage,
  ) {
    try {
      const fromIdx = msg.from_idx ?? '0-0';
      await this.codeeditorService.catchUpForm(client, fromIdx);
    } catch (err: any) {
      this.logger.error(`yjs-pull error: ${err?.message ?? err}`);
      client.emit('yjs-catchup', { ok: false });
    };
  };
  

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
