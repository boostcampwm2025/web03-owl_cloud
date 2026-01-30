import { WHITEBOARD_GROUP } from '@/whiteboard/whiteboard.constants';
import { Server } from 'socket.io';

export class WhiteboardWebsocket {
  private server!: Server;

  // 객체 참조
  bindServer(server: Server) {
    this.server = server;
  }

  broadcastToolRequest(
    room_id: string,
    event: string,
    payload: any,
    socket_id: string | undefined,
  ) {
    const namespace = `${WHITEBOARD_GROUP.WHITEBOARD}:${room_id}`;

    if (socket_id) {
      this.server.except(socket_id).to(namespace).emit(event, payload);
    } else {
      this.server.to(namespace).emit(event, payload);
    }
  }

  // socket을 모두 disconnect 하려면 socket_id가 필요하다.
  async disconnectWhiteboardRoom(room_id: string) {
    const room = `${WHITEBOARD_GROUP.WHITEBOARD}:${room_id}`;

    this.server.in(room).disconnectSockets(true);
  }
}
