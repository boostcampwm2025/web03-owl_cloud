


export type RoomMaxParticipantProps = {
  id : number;
  room_id : string;
  user_id : string;
  joined_at : Date;
  left_at? : Date | null;
};