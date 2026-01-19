export type GetRoomInfoDbResult = {
  title: string;
  host_nickname: string;
  room_id: string;
  has_password: boolean;
};

export type GetRoomInfoCacheResult = {
  current_participants: number;
  max_participants: number;
};

export type GetRoomInfoResult = {
  title: string;
  host_nickname: string;
  current_participants: number;
  max_participants: number;
  has_password: boolean;
};
