// 들어올때 dto
export type CreateRoomDto = {
  user_id: string;
  max_participants: number;
  title: string;
  password?: string;
};

// usecase 결과 값
export type CreateRoomResult = {
  code: string;
};
