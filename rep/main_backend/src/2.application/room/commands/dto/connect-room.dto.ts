export type ConnectRoomDto = {
  code: string;
  user_id: string;
  nickname: string;
  ip: string;
  socket_id: string;
  is_guest: boolean;
  password?: string;
};

export type InsertRoomDataDto = {
  socket_id: string;
  room_id: string;
  ip: string;
  user_id: string;
  nickname: string;
  is_guest: boolean;
};

export type ConnectResult = {
  room_id: string;
};
