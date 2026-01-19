export type DisConnectToolDto = {
  room_id: string;
  user_id: string;
  socket_id: string;
  tool: 'whiteboard' | 'codeeditor';
};
