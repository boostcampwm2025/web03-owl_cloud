export type OpenToolDto = {
  room_id: string;
  user_id: string;
  socket_id: string;
  tool: 'whiteboard' | 'codeeditor';
};

export type InsertToolInfoData = {
  room_id: string;
  user_id: string;
  socket_id: string;
  tool: 'whiteboard' | 'codeeditor';
  ticket: string;
};
