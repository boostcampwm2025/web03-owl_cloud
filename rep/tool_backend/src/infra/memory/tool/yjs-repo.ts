import * as Y from 'yjs';
import { IsDefined, IsNotEmpty, IsString } from "class-validator";

// yjs에서 저장할 map 모양
export type YjsRoomEntry = {
  doc : Y.Doc;
  idx : string;
};

// 다른 곳에서 실수 하지 않게 틀을 작성
export interface YjsRepository {
  // room_id에 따른 yhs 입력
  get(room_id: string): YjsRoomEntry | undefined;

  // 방이 없으면 생성 ( 실수 방지 )
  ensure(roomId: string): YjsRoomEntry;

  // entry 덮어 쓰기 
  set(room_id: string, entry: YjsRoomEntry): void;
  
  // room에 idx만 변경
  setIdx(room_id : string, idx : string) : void;

  // 삭제
  delete(room_id: string): void;
}

export const DEFAULT_IDX = '0-0';

// update할때 보내야 하는 값
export class YjsUpdateMessage {

  @IsNotEmpty()
  @IsString()
  prev_idx : string;

  @IsDefined()
  update : any; // 바로 버퍼로 받지말고 안전하게 gateway에서 변환하는게 안전

};

// yjs 반환 값
export type YjsRoomResult = {
  prev_idx : string;
  update_idx : string | undefined;
  update : Buffer
};

// 누락본이 필요할때는 이를 이용하면 좋다. 
export class YjsPullMessage {
  @IsNotEmpty()
  @IsString()
  from_idx: string; // 클라가 마지막에 받은 idx
}