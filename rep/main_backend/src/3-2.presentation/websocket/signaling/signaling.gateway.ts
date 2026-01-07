// 시그널링 서버의 역할이라고 할 수 있을 것 같다.
import { Logger, UsePipes, ValidationPipe } from "@nestjs/common";
import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io"
import { SignalingWebsocketService } from "./signaling.service";
import { TokenDto } from "@app/auth/commands/dto";
import { PayloadRes } from "@app/auth/queries/dto";
import { JwtWsGuard } from "../auth/guards/jwt.guard";
import { WEBSOCKET_AUTH_CLIENT_EVENT_NAME, WEBSOCKET_NAMESPACE, WEBSOCKET_SIGNALING_CLIENT_EVENT_NAME, WEBSOCKET_SIGNALING_EVENT_NAME } from "../websocket.constants";
import { JoinRoomValidate, SocketPayload } from "./signaling.validate";
import { ConnectResult, ConnectRoomDto } from "@app/room/commands/dto";
import { CHANNEL_NAMESPACE } from "@infra/channel/channel.constants";


@WebSocketGateway({
  namespace : WEBSOCKET_NAMESPACE.SIGNALING,
  cors : {
    origin : process.env.NODE_ALLOWED_ORIGIN?.split(",").map((origin) => origin.trim()),
    credentials : process.env.NODE_ALLOWED_CREDENTIALS === "true"
  },
  transports : ["websocket"],
  pingTimeout: 60 * 60 * 1000  // ping pong 허용 시간
})
export class SignalingWebsocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  
  // 현재 websocket server를 명명
  @WebSocketServer()
  private readonly server : Server;

  // logger -> 나중에 winston으로 변경가능
  private readonly logger = new Logger();

  constructor(
    private readonly jwtGuard : JwtWsGuard,
    private readonly signalingService : SignalingWebsocketService,
  ) {}

  // onGatewayInit으로 websocket 연결됐을때 사용할 함수
  afterInit(server: Server) : void {
    this.logger.log("signaling websocket 서버 등록 되었습니다.");

    // 여기서 middleware를 추가할 수도 있다. ( 등록 후 연결 요청하면 이 미들웨어를 거친다. )
    server.use(async (socket, next) => {
      try {
        // 회원 로직 http 핸드세이크 가정중 access_token, refresh_token 가져온후 검증 
        const jwtToken : TokenDto | undefined = this.signalingService.parseJwtToken(socket);
        if ( jwtToken ) {
          const payload : PayloadRes = await this.jwtGuard.execute(jwtToken);
          socket.data.user = this.signalingService.makeSocketData({ payload, socket });
        } else {
          socket.data.user = this.signalingService.makeSocketData({ payload : undefined, socket });
        };
        // 계속 진행
        next();
      } catch (e) {
        // 핸드셰이크 차단
        this.logger.error(e);
        next(new Error("UNAUTHORIZED"));
      }
    });
  };

  // 연결하자 마자 바로 해야 하는 하는 것 정의 가능
  async handleConnection(client: Socket) {
    const access_token : string = client.data.user.access_token;
    if (access_token) client.emit(WEBSOCKET_AUTH_CLIENT_EVENT_NAME.ACCESS_TOKEN, {access_token});
  }

  // 연결이 끊긴다면
  async handleDisconnect(client: Socket) {
    const user = client.data.user;
    const room_id = client.data.room_id;

    if (!user || !room_id) return;

    await this.signalingService.disconnectRoomService({
      user_id: user.user_id,
      socket_id: user.socket_id,
      room_id,
    });
  };

  // 맨처음 시그널링 서버에 방가입 연결을 요청할때
  @SubscribeMessage(WEBSOCKET_SIGNALING_EVENT_NAME.JOIN_ROOM)
  @UsePipes(new ValidationPipe({
    whitelist : true,
    transform : true
  }))
  async joinRoomGateway(
    @MessageBody() inputs : JoinRoomValidate,
    @ConnectedSocket() client : Socket
  ) : Promise<void> {
    // 방에 room_id를 받아온다. 
    const payload : SocketPayload = client.data.user;
    const dto : ConnectRoomDto = {
      ...inputs, 
      socket_id : payload.socket_id, user_id : payload.user_id, nickname : payload.nickname !== "" ? payload.nickname : inputs.nickname ?? "", ip : payload.ip
    };
    try {
      // 여기서는 에러가 발생하면 바로 연결을 끊어야 한다. 
      const result : ConnectResult = await this.signalingService.joinRoomService(dto);

      // 방 채널에 가입을 한다.
      const namespace : string = `${CHANNEL_NAMESPACE.SIGNALING}:${result.room_id}`;
      client.join(namespace);

      // client에 room_id를 저장한다. 
      client.data.room_id = result.room_id;

      // 일단 기본 세팅으로 응답
      client.emit(WEBSOCKET_SIGNALING_CLIENT_EVENT_NAME.JOINED, { ok : true });
    } catch (err) {
      this.logger.error(err);
      client.disconnect(true);
    };
  };

};