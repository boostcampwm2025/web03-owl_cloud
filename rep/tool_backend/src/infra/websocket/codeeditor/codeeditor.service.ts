import { CODEEDITOR_GROUP } from '@/codeeditor/codeeditor.constants';
import { Server } from 'socket.io';

export class CodeeditorWebsocket {
  private server!: Server;

  bindServer(server: Server) {
    this.server = server;
  }

  async disconnectCodeeditorRoom(room_id: string) {
    const room = `${CODEEDITOR_GROUP.CODEEDITOR}:${room_id}`;

    const sockets = await this.server.in(room).fetchSockets();
    for (const socket of sockets) {
      socket.disconnect(true);
    }
  }
}
