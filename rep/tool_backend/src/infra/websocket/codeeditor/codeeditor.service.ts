import { CODEEDITOR_GROUP } from '@/codeeditor/codeeditor.constants';
import { Server } from 'socket.io';

export class CodeeditorWebsocket {
  private server!: Server;

  bindServer(server: Server) {
    this.server = server;
  };

  async disconnectCodeeditorRoom(room_id: string) {
    const room = `${CODEEDITOR_GROUP.CODEEDITOR}:${room_id}`;

    this.server.in(room).disconnectSockets(true);
  };
};