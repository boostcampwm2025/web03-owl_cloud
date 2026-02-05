// 시그널링 서버의 역할이라고 할 수 있을 것 같다.
import { Inject, Logger, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SignalingWebsocketService } from './signaling.service';
import { TokenDto } from '@app/auth/commands/dto';
import { PayloadRes } from '@app/auth/queries/dto';
import { JwtWsGuard } from '../auth/guards/jwt.guard';
import {
  WEBSOCKET_AUTH_CLIENT_EVENT_NAME,
  WEBSOCKET_NAMESPACE,
  WEBSOCKET_PATH,
  WEBSOCKET_SIGNALING_CLIENT_EVENT_NAME,
  WEBSOCKET_SIGNALING_EVENT_NAME,
} from '../websocket.constants';
import {
  CheckFileValidate,
  ConnectToolTypeValidate,
  DisConnectToolTypeValidate,
  DownloadFileValidate,
  DtlsHandshakeValidate,
  JoinRoomValidate,
  type MessageResultProps,
  NegotiateIceValidate,
  OnConsumesValidate,
  OnConsumeValidate,
  OnProduceValidate,
  PauseConsumersValidate,
  pauseConsumerValidate,
  PauseProducerValidate,
  ResumeConsumersValidate,
  ResumeConsumerValidate,
  resumeProducerValidate,
  SendMessageValidate,
  SocketPayload,
  UploadFileValidate,
} from './signaling.validate';
import { ConnectResult, ConnectRoomDto, UploadFileResult } from '@app/room/commands/dto';
import { CHANNEL_NAMESPACE } from '@infra/channel/channel.constants';
import { GetRoomMembersResult } from '@app/room/queries/dto';
import { SIGNALING_WEBSOCKET } from '@infra/websocket/websocket.constants';
import { SignalingWebsocket } from '@infra/websocket/signaling/signaling.service';
import { PrometheusService } from '@infra/metric/prometheus/prometheus.service';
import { WsMetricsInterceptor } from '@infra/metric/prometheus/prometheus.intercepter';

@UseInterceptors(WsMetricsInterceptor)
@WebSocketGateway({
  namespace: WEBSOCKET_NAMESPACE.SIGNALING,
  path: WEBSOCKET_PATH, // http 핸드세이킹이 있을때 붙게 되는
  cors: {
    origin: process.env.NODE_ALLOWED_ORIGIN?.split(',').map((origin) => origin.trim()),
    credentials: process.env.NODE_ALLOWED_CREDENTIALS === 'true',
  },
  transports: ['websocket'],
  pingTimeout: 20 * 1000, // ping pong 허용 시간 ( 20초 )
})
export class SignalingWebsocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  // 현재 websocket server를 명명
  @WebSocketServer()
  private readonly server: Server;

  // logger -> 나중에 winston으로 변경가능
  private readonly logger = new Logger();

  constructor(
    private readonly jwtGuard: JwtWsGuard,
    private readonly signalingService: SignalingWebsocketService,
    @Inject(SIGNALING_WEBSOCKET) private readonly signalingSocket: SignalingWebsocket,
    private readonly prom: PrometheusService,
  ) {}

  // onGatewayInit으로 websocket 연결됐을때 사용할 함수
  afterInit(server: Server): void {
    this.logger.log('signaling websocket 서버 등록 되었습니다.');

    // 여기서 주입
    this.signalingSocket.bindServer(server);

    // 여기서 middleware를 추가할 수도 있다. ( 등록 후 연결 요청하면 이 미들웨어를 거친다. )
    server.use(async (socket, next) => {
      try {
        // 회원 로직 http 핸드세이크 가정중 access_token, refresh_token 가져온후 검증
        const jwtToken: TokenDto | undefined = this.signalingService.parseJwtToken(socket);
        if (jwtToken) {
          const payload: PayloadRes = await this.jwtGuard.execute(jwtToken);
          socket.data.user = this.signalingService.makeSocketData({ payload, socket });
        } else {
          socket.data.user = this.signalingService.makeSocketData({ payload: undefined, socket });
        }
        // 계속 진행
        next();
      } catch (e) {
        // 핸드셰이크 차단
        this.logger.error(e);
        next(new Error('UNAUTHORIZED'));
      }
    });
  }

  // 연결하자 마자 바로 해야 하는 하는 것 정의 가능 -> access_token을 보내준다.
  async handleConnection(client: Socket) {
    const ns: string = client.nsp.name; // 여기서는 /signal이 될 예정이다.
    this.prom.wsConnectionsCurrent.labels(ns).inc();
    this.prom.wsConnectionsTotal.labels(ns).inc();
    const access_token: string = client.data.user.access_token;
    if (access_token) client.emit(WEBSOCKET_AUTH_CLIENT_EVENT_NAME.ACCESS_TOKEN, { access_token });
  }

  // 연결이 끊긴다면 -> 이때 방에 전달하는 무언가가 필요하다.
  async handleDisconnect(client: Socket) {
    // 연결과 관련된 요청
    const ns = client.nsp.name;
    this.prom.wsConnectionsCurrent.labels(ns).dec();
    const reason =
      (client as any).disconnectReason ?? (client as any).conn?.closeReason ?? 'unknown';
    this.prom.wsDisconnectsTotal.labels(ns, reason).inc();

    const user = client.data.user;
    const room_id = client.data.room_id;

    if (!user || !room_id) return;

    await this.signalingService.disconnectRoomService({
      user_id: user.user_id,
      socket_id: user.socket_id,
      room_id,
    });

    // 다른 방에 현재 client가 나갔다는 것을 알리는 무언가가 필요
    const namespace: string = `${CHANNEL_NAMESPACE.SIGNALING}:${room_id}`;
    client.to(namespace).emit(WEBSOCKET_SIGNALING_CLIENT_EVENT_NAME.USER_CLOSED, user.user_id); // 어떤 식으로 보내야 협업이 편할지 하나식 맞춰야 한다.
  }

  // 맨처음 시그널링 서버에 방가입 연결을 요청할때
  @SubscribeMessage(WEBSOCKET_SIGNALING_EVENT_NAME.JOIN_ROOM)
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  )
  async joinRoomGateway(
    @MessageBody() inputs: JoinRoomValidate,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    // 방에 room_id를 받아온다.
    const payload: SocketPayload = client.data.user;
    const dto: ConnectRoomDto = {
      ...inputs,
      is_guest: payload.is_guest,
      socket_id: payload.socket_id,
      user_id: payload.user_id,
      nickname: payload.nickname !== '' ? payload.nickname : (inputs.nickname ?? ''),
      ip: payload.ip,
    };
    try {
      const result: ConnectResult = await this.signalingService.joinRoomService(dto);

      // 1. 방 채널에 가입을 한다.
      const namespace: string = `${CHANNEL_NAMESPACE.SIGNALING}:${result.room_id}`;
      client.join(namespace);

      // client에 room_id를 저장한다.
      if (!payload.nickname) client.data.user.nickname = inputs.nickname;
      client.data.room_id = result.room_id;

      // 2. 일단 기본 세팅으로 응답
      client.emit(WEBSOCKET_SIGNALING_CLIENT_EVENT_NAME.JOINED, {
        user_id: payload.user_id,
        is_hosted: result.is_hosted,
        ok: true,
      });

      // 3. 방에 알릴 것이다 현재 접속을 했다고 ( 기존에 dtls 핸드세이킹에서 일어나는걸 이제 여기서 처리한다. )
      const room_id: string = client.data.room_id;
      const newUserNamespace: string = `${CHANNEL_NAMESPACE.SIGNALING}:${room_id}`;
      client
        .to(newUserNamespace)
        .emit(
          WEBSOCKET_SIGNALING_CLIENT_EVENT_NAME.NEW_USER,
          this.signalingService.makeUserInfo(client),
        );
    } catch (err) {
      this.logger.error(err);
      throw new WsException({ message: err.message ?? '에러 발생', status: err.status ?? 500 });
    }
  }

  // 방에 가입 한 후 라우터 생성 -> 방에 가입 시킨 다음에 본격적으로 라우터를 생성하는 이벤트를 주어야 한다.
  // 따로 분리해놓은 이유는 -> 정확히 방에 가입한 사람들만 이것을 이용하게 하고 싶기 때문이다.
  // reture을 안준 이유도 sdp를 하는 방식이 다 다르기 때문이다.
  @SubscribeMessage(WEBSOCKET_SIGNALING_EVENT_NAME.NEGOTIATE_SDP)
  async sdpNegotiateGateway(@ConnectedSocket() client: Socket) {
    const room_id: string = client.data.room_id;

    try {
      // 1. sfu 서버에 room_id에 router에 설정을 요구한다 이를 바탕으로 SDP를 할 예정
      const rtpCapabilities = await this.signalingService.sdpNegotiate(room_id);

      // 2. sdp 정보 반환
      return { ok: true, rtpCapabilities };
    } catch (err) {
      this.logger.error(err);
      throw new WsException({ message: err.message ?? '에러 발생', status: err.status ?? 500 });
    }
  }

  // 여기서 추가할 점은 ( send, recv에 역할을 알 수 있는 매개변수가 있다면 좋을것이다 왜냐하면 이걸 이용해서 두개다 협상을 할거니까 )
  @SubscribeMessage(WEBSOCKET_SIGNALING_EVENT_NAME.NEGOTIATE_ICE)
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  )
  async iceNegotiateGateway(
    @ConnectedSocket() client: Socket,
    @MessageBody() validate: NegotiateIceValidate,
  ) {
    try {
      // 1. sfu 서버에서 ice 협상에 필요한 정보 요구하고 dtls에 필요한 정보도 요구
      const transportOptions = await this.signalingService.iceNegotiate(client, validate.type);

      return { ok: true, transportOptions };
    } catch (err) {
      this.logger.error(err);
      throw new WsException({ message: err.message ?? '에러 발생', status: err.status ?? 500 });
    }
  }

  // dtls 핸드세이크 과정 -> 사실상 여기에서 webrtc가 준비되었다고 보면 된다. - 보안 검증도 여기서 거쳐야 한다.
  @SubscribeMessage(WEBSOCKET_SIGNALING_EVENT_NAME.DTLS_HANDSHAKE)
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  )
  async dtlsHandshakeGateway(
    @ConnectedSocket() client: Socket,
    @MessageBody() validate: DtlsHandshakeValidate,
  ) {
    try {
      // 1. dtls 핸드세이크를 거칠것이다.
      await this.signalingService.dtlsHandshake(client, validate);

      // 3. 애초에 여기서 방의 정보를 받아오는 방법도 있을것 같다.
      return { ok: true };
    } catch (err) {
      this.logger.error(err);
      throw new WsException({ message: err.message ?? '에러 발생', status: err.status ?? 500 });
    }
  }

  // 본격적으로 프론트엔드에서 회의방에 배포하고 싶을때 사용 -> 이미 있다면 ON하는 기능을 추가 해야 한다.
  @SubscribeMessage(WEBSOCKET_SIGNALING_EVENT_NAME.PRODUCE)
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  )
  async onProduceGateway(
    @ConnectedSocket() client: Socket,
    @MessageBody() validate: OnProduceValidate,
  ) {
    try {
      // 1. producer 등록
      const producerInfo = await this.signalingService.onProduce(client, validate);

      // 2. ( 다른 유저들에게 ) 알려야 함 -> 지금 등록했다는 사실을
      const room_id: string = client.data.room_id;
      const namespace: string = `${CHANNEL_NAMESPACE.SIGNALING}:${room_id}`;
      if (validate.resume && validate.type === 'cam')
        client.to(namespace).emit(WEBSOCKET_SIGNALING_CLIENT_EVENT_NAME.CAMERA_ON, producerInfo);
      else
        client
          .to(namespace)
          .emit(WEBSOCKET_SIGNALING_CLIENT_EVENT_NAME.ALERT_PRODUCED, producerInfo);

      // 3. 반환
      return { producerInfo };
    } catch (err) {
      this.logger.error(err);
      throw new WsException({ message: err.message ?? '에러 발생', status: err.status ?? 500 });
    }
  }

  // 회의방에있는 produce를 구독하고 싶을때 사용
  @SubscribeMessage(WEBSOCKET_SIGNALING_EVENT_NAME.CONSUME)
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  )
  async onConsumeGateway(
    @ConnectedSocket() client: Socket,
    @MessageBody() validate: OnConsumeValidate,
  ) {
    try {
      // 1. consumer 등록
      const consumerInfo = await this.signalingService.onConsume(client, validate);

      // 2. 받아와야 한다. ( 아직 packet받는거 허용은 안함 )
      return { consumerInfo };
    } catch (err) {
      this.logger.error(err);
      throw new WsException({ message: err.message ?? '에러 발생', status: err.status ?? 500 });
    }
  }

  // consumer가 준비가 되었고 이제 데이터를 내려줘도 괜찮다는 이벤트
  @SubscribeMessage(WEBSOCKET_SIGNALING_EVENT_NAME.RESUME)
  async resumeConsumerGateway(
    @ConnectedSocket() client: Socket,
    @MessageBody() validate: ResumeConsumerValidate,
  ) {
    try {
      // 1. consumer 재개
      await this.signalingService.resumeConsumer(client, validate);

      return { ok: true };
    } catch (err) {
      this.logger.error(err);
      throw new WsException({ message: err.message ?? '에러 발생', status: err.status ?? 500 });
    }
  }

  // 현재 회의방 유저들의 정보를 얻고 싶을때 사용하는 로직 -> 시그널링에서 처리할 수 있는 로직 -> 이거대신 입장이 되었을때 보내는건 어떨까?
  @SubscribeMessage(WEBSOCKET_SIGNALING_EVENT_NAME.ROOM_MEMBERS)
  async getRoomMembersGateway(@ConnectedSocket() client: Socket): Promise<GetRoomMembersResult> {
    try {
      return this.signalingService.getMemberData(client);
    } catch (err) {
      this.logger.error(err);
      throw new WsException({ message: err.message ?? '에러 발생', status: err.status ?? 500 });
    }
  }

  // consumer를 pause 하는 로직 ( 잠시 패킷을 안받겠다는 것 )
  @SubscribeMessage(WEBSOCKET_SIGNALING_EVENT_NAME.PAUSE)
  async pauseConsumerGateway(
    @ConnectedSocket() client: Socket,
    @MessageBody() validate: pauseConsumerValidate,
  ) {
    try {
      // 1. consumer 멈춤
      await this.signalingService.pauseConsumer(client, validate);

      return { ok: true };
    } catch (err) {
      this.logger.error(err);
      throw new WsException({ message: err.message ?? '에러 발생', status: err.status ?? 500 });
    }
  }

  // 여러개의 producer_id를 한번에 구독하겠다는 로직도 넣고 한번에 재개 + 한번에 paused도 좋아보인다.
  @SubscribeMessage(WEBSOCKET_SIGNALING_EVENT_NAME.CONSUMES)
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  )
  async onConsumesGateway(
    @ConnectedSocket() client: Socket,
    @MessageBody() validate: OnConsumesValidate,
  ) {
    try {
      // 1. 여러개의 consumer 등록
      const consumerInfos = await this.signalingService.onConsumes(client, validate);

      // 2. 받아와야 한다. ( 아직 packet받는거 허용은 안함 )
      return { consumerInfos };
    } catch (err) {
      this.logger.error(err);
      throw new WsException({ message: err.message ?? '에러 발생', status: err.status ?? 500 });
    }
  }

  // 여러개의 consumers를 다시 재개하겠다.
  @SubscribeMessage(WEBSOCKET_SIGNALING_EVENT_NAME.RESUMES)
  async resumeConsumersGateway(
    @ConnectedSocket() client: Socket,
    @MessageBody() validate: ResumeConsumersValidate,
  ) {
    try {
      // 1. 여러개의 consumer 재개
      await this.signalingService.resumeConsumers(client, validate);

      return { ok: true };
    } catch (err) {
      this.logger.error(err);
      throw new WsException({ message: err.message ?? '에러 발생', status: err.status ?? 500 });
    }
  }

  // 여러개의 consumers를 다시 멈추겠다.
  @SubscribeMessage(WEBSOCKET_SIGNALING_EVENT_NAME.PAUSES)
  async pauseConsumersGateway(
    @ConnectedSocket() client: Socket,
    @MessageBody() validate: PauseConsumersValidate,
  ) {
    try {
      // 1. 여러개의 consumer 멈춤
      await this.signalingService.pauseConsumers(client, validate);

      return { ok: true };
    } catch (err) {
      this.logger.error(err);
      throw new WsException({ message: err.message ?? '에러 발생', status: err.status ?? 500 });
    }
  }

  // whiteboard를 열겠다.
  @SubscribeMessage(WEBSOCKET_SIGNALING_EVENT_NAME.OPEN_WHITEBOARD)
  async openWhiteboardGateway(@ConnectedSocket() client: Socket) {
    try {
      const ticket: string = await this.signalingService.openTool(client, 'whiteboard');

      return { ticket, tool: 'whiteboard' };
    } catch (err) {
      this.logger.error(err);
      throw new WsException({ message: err.message ?? '에러 발생', status: err.status ?? 500 });
    }
  }

  // codeeditor를 열겠다.
  @SubscribeMessage(WEBSOCKET_SIGNALING_EVENT_NAME.OPEN_CODEEDITOR)
  async openCodeEditorGateway(@ConnectedSocket() client: Socket) {
    try {
      const ticket: string = await this.signalingService.openTool(client, 'codeeditor');

      return { ticket, tool: 'codeeditor' };
    } catch (err) {
      this.logger.error(err);
      throw new WsException({ message: err.message ?? '에러 발생', status: err.status ?? 500 });
    }
  }

  @SubscribeMessage(WEBSOCKET_SIGNALING_EVENT_NAME.CONNECT_TOOL)
  async connectToolGateway(
    @ConnectedSocket() client: Socket,
    @MessageBody() validate: ConnectToolTypeValidate,
  ) {
    try {
      const ticket: string = await this.signalingService.connectTool(client, validate.tool);

      return { ticket, tool: validate.tool };
    } catch (err) {
      this.logger.error(err);
      throw new WsException({ message: err.message ?? '에러 발생', status: err.status ?? 500 });
    }
  }

  // tool의 연결을 끊고 싶을때 사용한다.
  @SubscribeMessage(WEBSOCKET_SIGNALING_EVENT_NAME.DISCONNECT_TOOL)
  async disconnectToolGateway(
    @ConnectedSocket() client: Socket,
    @MessageBody() validate: DisConnectToolTypeValidate,
  ) {
    try {
      await this.signalingService.disconnectTool(client, validate.tool);

      return { ok: true };
    } catch (err) {
      this.logger.error(err);
      throw new WsException({ message: err.message ?? '에러 발생', status: err.status ?? 500 });
    }
  }

  // 카메라 or 마이크를 ON할때 사용한다.
  @SubscribeMessage(WEBSOCKET_SIGNALING_EVENT_NAME.PRODUCE_ON)
  async resumeProduceGateway(
    @ConnectedSocket() client: Socket,
    @MessageBody() validate: resumeProducerValidate,
  ) {
    try {
      const producerInfo = await this.signalingService.resumeProduce(client, validate);

      // 카메라가 켜졌다고 인원에게 알려준다.
      const room_id: string = client.data.room_id;
      const namespace: string = `${CHANNEL_NAMESPACE.SIGNALING}:${room_id}`;
      client.to(namespace).emit(WEBSOCKET_SIGNALING_CLIENT_EVENT_NAME.CAMERA_ON, producerInfo);

      return { producerInfo };
    } catch (err) {
      this.logger.error(err);
      throw new WsException({ message: err.message ?? '에러 발생', status: err.status ?? 500 });
    }
  }

  // 카메라 or 마이크를 OFF할때 사용한다. -> 대신 카메라가 존재해야 한다.
  @SubscribeMessage(WEBSOCKET_SIGNALING_EVENT_NAME.PRODUCE_OFF)
  async pauseProduceGateway(
    @ConnectedSocket() client: Socket,
    @MessageBody() validate: PauseProducerValidate,
  ) {
    try {
      const producerInfo = await this.signalingService.pauseProduce(client, validate);

      // 모두에게 알림 - 마이크 or 카메라 껏다고 방에 인원에게 알린다.
      const room_id: string = client.data.room_id;
      const namespace: string = `${CHANNEL_NAMESPACE.SIGNALING}:${room_id}`;
      client.to(namespace).emit(WEBSOCKET_SIGNALING_CLIENT_EVENT_NAME.ALERT_PRODUCED, producerInfo); // 현재 마이크 or 카메라가 꺼졌습니다.

      return { ok: true };
    } catch (err) {
      this.logger.error(err);
      throw new WsException({ message: err.message ?? '에러 발생', status: err.status ?? 500 });
    }
  }

  // 화면공유를 내릴때 사용한다. -> 화면 공유가 되어있는 상태여야 한다.
  @SubscribeMessage(WEBSOCKET_SIGNALING_EVENT_NAME.SCREEN_STOP)
  async stopScreenGateway(@ConnectedSocket() client: Socket) {
    try {
      const result = await this.signalingService.stopScreen(client);

      // 모두에게 알림 - 화면공유가 꺼졌다고 방에 인원에게 알린다.
      const room_id: string = client.data.room_id;
      const namespace: string = `${CHANNEL_NAMESPACE.SIGNALING}:${room_id}`;
      client.to(namespace).emit(WEBSOCKET_SIGNALING_CLIENT_EVENT_NAME.SCREEN_STOP, result);

      return result;
    } catch (err) {
      this.logger.error(err);
      throw new WsException({ message: err.message ?? '에러 발생', status: err.status ?? 500 });
    }
  }

  // 파일 전송 기능 ( 전송할 url 전달 )
  @SubscribeMessage(WEBSOCKET_SIGNALING_EVENT_NAME.UPLOAD_FILE)
  async uploadFileGateway(
    @ConnectedSocket() client: Socket,
    @MessageBody() validate: UploadFileValidate,
  ): Promise<UploadFileResult> {
    try {
      const result = await this.signalingService.uploadFileInfo(client, validate);

      return result;
    } catch (err) {
      this.logger.error(err);
      throw new WsException({ message: err.message ?? '에러 발생', status: err.status ?? 500 });
    }
  }

  // 파일 전송을 확인할때 사용한다.
  @SubscribeMessage(WEBSOCKET_SIGNALING_EVENT_NAME.FILE_CHECK)
  async checkFileUploadGateway(
    @ConnectedSocket() client: Socket,
    @MessageBody() validate: CheckFileValidate,
  ): Promise<MessageResultProps> {
    try {
      const result = await this.signalingService.checkFileUpload(client, validate);

      // 모든 방에 정보를 알려야 한다.
      const roomMessage: MessageResultProps = {
        ...result,
        thumbnail_url: result.thumbnail_url,
        message: undefined,
        type: 'file',
      };
      const room_id: string = client.data.room_id;
      const namespace: string = `${CHANNEL_NAMESPACE.SIGNALING}:${room_id}`;
      client.to(namespace).emit(WEBSOCKET_SIGNALING_CLIENT_EVENT_NAME.RECV_MESSAGE, roomMessage); // 방에 파일을 전달한다.

      return roomMessage;
    } catch (err) {
      this.logger.error(err);
      throw new WsException({ message: err.message ?? '에러 발생', status: err.status ?? 500 });
    }
  }

  // 파일을 다운 받을때 사용하는 로직
  @SubscribeMessage(WEBSOCKET_SIGNALING_EVENT_NAME.FILE_DOWNLOAD)
  async downloadFileGateway(
    @ConnectedSocket() client: Socket,
    @MessageBody() validate: DownloadFileValidate,
  ): Promise<string> {
    try {
      return this.signalingService.downloadFile(client, validate);
    } catch (err) {
      this.logger.error(err);
      throw new WsException({ message: err.message ?? '에러 발생', status: err.status ?? 500 });
    }
  }

  // 메시지를 보낼때 사용하는 로직
  @SubscribeMessage(WEBSOCKET_SIGNALING_EVENT_NAME.SEND_MESSAGE)
  sendMessageGateway(
    @ConnectedSocket() client: Socket,
    @MessageBody() validate: SendMessageValidate,
  ): MessageResultProps {
    try {
      const result = this.signalingService.makeMessage(client, validate);

      const room_id: string = client.data.room_id;
      const namespace: string = `${CHANNEL_NAMESPACE.SIGNALING}:${room_id}`;
      client.to(namespace).emit(WEBSOCKET_SIGNALING_CLIENT_EVENT_NAME.RECV_MESSAGE, result);

      return result;
    } catch (err) {
      this.logger.error(err);
      throw new WsException({ message: err.message ?? '에러 발생', status: err.status ?? 500 });
    }
  }
}
