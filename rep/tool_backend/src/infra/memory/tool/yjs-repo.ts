import { IsDefined, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import * as Y from 'yjs';

export const YJS_ENTITY_MAX_NUMBER = 1000; // 최대 사이즈

// yjs에서 저장할 map 모양
export type UpdateEntry = {
  seq: number; // 단조증가
  update: Uint8Array;
};

export type YjsRoomEntry = {
  doc: Y.Doc;
  seq: number;

  // 고정 배열로 사용할 예정이다.
  ring: Array<UpdateEntry | undefined>;
  ringSize: number;
};

// 다른 곳에서 실수 하지 않게 틀을 작성
export interface YjsRepository {
  get(room_id: string): YjsRoomEntry | undefined; // room_id에 따른 yjs 입력
  ensure(room_id: string): YjsRoomEntry; // 방이 없으면 생성 ( 실수 방지 )

  // update 적용
  applyAndAppendUpdate(room_id: string, update: Uint8Array): number;

  // 마지막 seq 이후에 업데이트를 링에서 뽑는다.
  getUpdatesSince(room_id: string, last_seq: number): UpdateEntry[] | null;

  // 전체를 업데이트 해준다.
  encodeFull(room_id: string): { seq: number; update: Uint8Array };

  // snapshot 생성
  encodeSnapshot(room_id: string): Uint8Array;

  // snapshot 추가
  applySnapshot(room_id: string, snapshotUpdate: Uint8Array): void;

  // 삭제
  delete(room_id: string): void;
}

export class YjsUpdateClientPayload {
  @IsInt()
  @Min(0)
  last_seq: number; // 클라가 마지막으로 적용한 서버 seq

  @IsOptional()
  update?: unknown; // yjs update (socket.io 전송용) 지금은 unknown으로하고 서버에서 검증

  @IsOptional()
  updates?: unknown; // 한번에 보낼때 이를 참고
}

export type YjsSyncOrigin =
  | 'UPDATE_REJECTED' // yjs-update 처리 중 missed라서 drop + sync 내려준다
  | 'SYNC_REQ' // yjs-sync-req 요청에 대한 응답
  | 'INIT' // 최초 접속/재접속 등
  | 'ADMIN';

// sync와 관련된 payload
export type YjsSyncServerPayload =
  | { type: 'ack'; ok: true; server_seq: number; origin?: YjsSyncOrigin }
  | {
      type: 'patch';
      ok: true;
      from_seq: number;
      to_seq: number;
      updates: Buffer[];
      server_seq: number;
      origin: YjsSyncOrigin;
    }
  | { type: 'full'; ok: true; server_seq: number; update: Buffer; origin: YjsSyncOrigin }
  | {
      type: 'error';
      ok: false;
      code: 'BAD_PAYLOAD' | 'ROOM_NOT_FOUND' | 'INTERNAL';
      message?: string;
      origin?: YjsSyncOrigin;
    }; // error 코드들 BAD_PAYLOAD는 update의 종류에 따라서

export class YjsSyncReqPayload {
  @IsInt()
  @Min(0)
  last_seq: number;
}
