import { NotAcceptEqualLengthError, NotAllowRoomStatusError } from "@error/domain/room.error";
import { NotAllowMaxLengthText, NotAllowMinValue, NotTypeHash } from "@error/domain/user/user.error";
import { baseVo } from "@domain/shared";


export const statusTypes = ["open", "closed"] as const;
export type RoomStatusProps = (typeof statusTypes)[number];

export type RoomProps = {
  room_id : string;
  code : string;
  title : string;
  password_hash? : string | null;
  owner_user_id : string;
  max_participants : number;
  status : RoomStatusProps;
  created_at? : Date;
  updated_at? : Date;
  deleted_at? : Date | null;
};

// room에 입장 코드에 대해서
export function roomCodeVo(code : RoomProps["code"]) : string {

  const name : string = "code";

  baseVo({ name, value : code, type : "string" });

  // 32자리가 맞는지 확인
  const length : number = 32;
  if ( code.length !== length ) throw new NotAcceptEqualLengthError({ name, length });

  return code.trim();
};

// room에 타이틀에 대해서 
export function roomTitleVo(title : RoomProps["title"]) : string {

  const name : string = "title";

  baseVo({ name, value : title, type : "string" });

  const length : number = 100;
  if ( title.length > length ) throw new NotAllowMaxLengthText({ name, length });

  return title.trim();
}

// room에 비밀번호에 대해서
const hashTypeRegXp: Array<RegExp> = [
  /^\$argon2(?:id|i|d)\$(?:v=\d+\$)?(?=[^$]*\bm=\d+\b)(?=[^$]*\bt=\d+\b)(?=[^$]*\bp=\d+\b)[^$]*\$[A-Za-z0-9+/]+={0,2}\$[A-Za-z0-9+/]+={0,2}$/,
  /^\$(2[aby])\$(0[4-9]|[12]\d|3[01])\$[./A-Za-z0-9]{22}[./A-Za-z0-9]{31}$/,
];  
export function roomPasswordHashVo(password_hash : Exclude<RoomProps["password_hash"], null | undefined>) : string {
  
  const name : string = "password_hash";

  baseVo({ name, value : password_hash, type : "string" });

  let checkHash: boolean = false;
  hashTypeRegXp.forEach((hashReg: RegExp): void => {
    if (hashReg.test(password_hash)) checkHash = true;
  });
  if (!checkHash) throw new NotTypeHash();

  return password_hash.trim();
};

// max_participants에 대해서
export function roomMaxParticipantsVo(max_participants : RoomProps["max_participants"]) : number {

  const name : string = "max_participants";

  baseVo({ name, value : max_participants, type : "number" });

  const min : number = 1;
  if ( max_participants < min ) throw new NotAllowMinValue({ name, min });

  return max_participants;
};

// status에 대해서
export function roomStatusVo(status : RoomProps["status"]) : RoomStatusProps {

  const name : string = "status";

  baseVo({ name, value : status, type : "string" });

  if ( !statusTypes.includes(status) ) throw new NotAllowRoomStatusError();

  return status;
}