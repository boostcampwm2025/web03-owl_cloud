export type UpdateRoomPasswordDto = {
  user_id: string; // payload에서 가져와야 한다.
  new_password: string | null;
  code: string;
  // 과거 password를 물어볼수도 있다.
};

export type UpdateRoomInfoResult = {
  room_id: string;
  prev_password: string | null; // 후에 필요할 수도 있다.
};
