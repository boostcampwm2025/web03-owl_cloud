import { AuthType } from "@/guards/guard.type";
import { Logger } from "@nestjs/common";
import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";


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
export class WhiteboardWebsocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {

  @WebSocketServer()
  private readonly server : Server;

  private readonly logger = new Logger();

  constructor() {}

  // 연결을 했을때 
  afterInit(server: Server) : void {
    
    server.use(async (socket, next) => {
      try {
        const { token, type } = socket.handshake.auth as AuthType;

        if (!token) return next(new Error("TOKEN_REQUIRED"));
        if (type !== "main" && type !== "sub") return next(new Error("INVALID_TYPE"));
        


      } catch (err) {
        this.logger.error(err);
        next(new Error("인증 에러"));
      };
    });
  };

  // 연결 완료 후
  async handleConnection(client: Socket) {
    
  }

  // 연결이 끊겼을때
  async handleDisconnect(client: Socket) {
    
  }

}