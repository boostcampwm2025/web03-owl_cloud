// 시그널링 서버의 역할이라고 할 수 있을 것 같다.
import { WebSocketGateway } from "@nestjs/websockets";


@WebSocketGateway({
  namespace : "/api/ws/signal",
  cors : {
    origin : process.env.NODE_ALLOWED_ORIGIN?.split(",").map((origin) => origin.trim()),
    credentials : process.env.NODE_ALLOWED_CREDENTIALS === "true"
  },
  transports : ["websocket"],
  pingTimeout: 60 * 60 * 1000 
})
export class SignalingWebsocketGateway {
  

};