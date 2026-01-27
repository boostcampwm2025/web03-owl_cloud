import * as Y from 'yjs';

// 다른 곳에서 실수 하지 않게 틀을 작성
export interface YjsRepository {
  get(room_id: string): Y.Doc | undefined;
  set(room_id: string, doc: Y.Doc): void;
  delete(room_id: string): void;
}
