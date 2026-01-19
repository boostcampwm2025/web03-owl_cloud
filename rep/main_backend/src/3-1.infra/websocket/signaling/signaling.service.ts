import { CHANNEL_NAMESPACE } from '@infra/channel/channel.constants';
import { Server } from 'socket.io';

// signalling websocket에 객체를 다른곳에서도 쓸수 있게
export class SignalingWebsocket {
  private server!: Server;

  // 객체를 참조한다. -> 그래서 새로 WEBSOCKET을 만드는 것이 아닌 CLIENT를 참고한다.
  bindServer(server: Server) {
    this.server = server;
  }

  // 이 websocket도 가입을 시킨다.
  broadcastToolRequest(
    room_id: string,
    event: string,
    payload: any,
    socket_id: string | undefined,
  ) {
    const namespace = `${CHANNEL_NAMESPACE.SIGNALING}:${room_id}`;

    if (socket_id) {
      this.server.except(socket_id).to(namespace).emit(event, payload);
    } else {
      this.server.to(namespace).emit(event, payload);
    }
  }

  emitToSocket(socket_id: string, event: string, payload: any) {
    this.server.to(socket_id).emit(event, payload);
  }
}
