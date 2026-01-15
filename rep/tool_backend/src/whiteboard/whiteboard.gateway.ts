import { GuardService } from "@/guards/guard.service";
import { AuthType, ToolBackendPayload } from "@/guards/guard.type";
import { Logger } from "@nestjs/common";
import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { WHITEBOARD_CLIENT_EVENT_NAME, WHITEBOARD_GROUP } from "./whiteboard.constants";


// 아래쪽에 whiteboard 관련 @Submessage를 붙이셔서 해주시면 될것 같아요 ㅎㅎ
@WebSocketGateway({
  namespace : process.env.NODE_BACKEND_WEBSOCKET_PREFIX,
  path : process.env.NODE_BACKEND_WEBSOCKET_WHITEBOARD, // http 핸드세이킹이 있을때 붙게 되는 
  cors : {
    origin : process.env.NODE_ALLOWED_ORIGIN?.split(",").map((origin) => origin.trim()),
    credentials : process.env.NODE_ALLOWED_CREDENTIALS === "true"
  },
  transports : ["websocket"],
  pingTimeout: 20 * 1000  // ping pong 허용 시간 ( 20초 )
})
export class WhiteboardWebsocketGateway implements OnGatewayInit, OnGatewayConnection {

  @WebSocketServer()
  private readonly server : Server;

  private readonly logger = new Logger();

  constructor(
    private readonly guard : GuardService
  ) {}

  // 연결을 했을때 
  afterInit(server: Server) : void {
    
    server.use(async (socket, next) => {
      try {
        const { token, type } = socket.handshake.auth as AuthType;

        if (!token) return next(new Error("TOKEN_REQUIRED"));
        if (type !== "main" && type !== "sub") return next(new Error("INVALID_TYPE"));
        
        const verified = await this.guard.verify(token);

        const payload : ToolBackendPayload = {
          room_id : verified.room_id,
          user_id : verified.sub,
          tool : verified.tool
        };

        if ( payload.tool !== "whiteboard" ) throw new Error("whiteboard만 가능한 gateway입니다.");

        // main인 경우 emit 해준다. 
        socket.data.payload = payload;
        return next();
      } catch (err) {
        this.logger.error(err);
        next(new Error("인증 에러"));
      };
    });
  };

  // 연결 완료 후
  async handleConnection(client: Socket) {
    const payload : ToolBackendPayload = client.data.payload;
    if (!payload) {
      client.disconnect(true);
      return;
    }

    // 방 입장후 알림
    const namespace : string = `${WHITEBOARD_GROUP.WHITEBOARD}:${payload.room_id}`; // 방가입
    client.join(namespace);
    client.emit(WHITEBOARD_CLIENT_EVENT_NAME.PERMISSION, { ok : true });
  };


}