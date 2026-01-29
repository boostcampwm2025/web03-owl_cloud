import { Injectable } from '@nestjs/common';
import {
  UpdateEntry,
  WHITEBOARD_RING_SIZE,
  YJS_ENTITY_MAX_NUMBER,
  YjsRepository,
  YjsRoomEntry,
  YjsWhiteboardRoomEntry,
} from './yjs-repo';
import * as Y from 'yjs';

// 두 repo는 현재 동일하다
@Injectable()
export class WhiteboardRepository implements YjsRepository {
  private readonly roomDocs = new Map<string, YjsWhiteboardRoomEntry>();

  // yjs room 정보 가져오기
  get(room_id: string): YjsWhiteboardRoomEntry | undefined {
    return this.roomDocs.get(room_id);
  }

  // 방 정보가 없으면 새로 생성
  ensure(room_id: string): YjsWhiteboardRoomEntry {
    let entry = this.roomDocs.get(room_id);
    if (!entry) {
      const ringSize = WHITEBOARD_RING_SIZE; // 20000
      entry = {
        doc: new Y.Doc(),
        seq: 0,
        baseSeq: 0,
        ringSize,
        ring: new Array<UpdateEntry | undefined>(ringSize),
      };
      this.roomDocs.set(room_id, entry);
    }
    return entry;
  }

  // docs를 update하고 seq를 증가시키고 링버퍼를 고정한다.
  applyAndAppendUpdate(room_id: string, update: Uint8Array): number {
    const entry = this.ensure(room_id);

    // doc 업데이트
    Y.applyUpdate(entry.doc, update);

    // 서버 seq 증가 (단조 증가)
    entry.seq += 1;

    // 링버퍼에 저장 (고정 배열 + mod)
    const slot = (entry.seq - 1) % entry.ringSize;
    entry.ring[slot] = { seq: entry.seq, update };

    return entry.seq;
  }

  // 현재 repo에 정보를 업데이트 해준다 null이면 full sync
  getUpdatesSince(room_id: string, last_seq: number): UpdateEntry[] | null {
    const entry = this.ensure(room_id);

    // 이미 최신이면 줄 게 없음
    if (last_seq >= entry.seq) return [];

    // 링버퍼가 커버하는 최소 seq 계산
    // 예) seq=1500, ringSize=1000 -> 커버 범위는 (501..1500)
    const minSeqKeptBySnapshot = entry.baseSeq + 1;
    const minSeqKeptByRing = Math.max(1, entry.seq - entry.ringSize + 1);
    const minSeqKept = Math.max(minSeqKeptByRing, minSeqKeptBySnapshot);

    // 요청이 너무 오래돼서 링에 없음 -> full sync 유도
    if (last_seq + 1 < minSeqKept) return null;

    // last_seq+1 부터 entry.seq 까지 순서대로 복원
    const updates: UpdateEntry[] = [];
    for (let s = last_seq + 1; s <= entry.seq; s++) {
      const slot = (s - 1) % entry.ringSize;
      const item = entry.ring[slot];

      if (!item || item.seq !== s) {
        return null; // 중간 누락 -> full sync로
      }

      updates.push(item);
    }

    return updates;
  }

  // null이라면 전체를 반환한다.
  encodeFull(room_id: string): { seq: number; update: Uint8Array } {
    const entry = this.ensure(room_id);
    const full = Y.encodeStateAsUpdate(entry.doc);
    return { seq: entry.seq, update: full };
  }

  // snapshot을 생성한다.
  encodeSnapshot(room_id: string): Uint8Array {
    const entry = this.ensure(room_id);
    return Y.encodeStateAsUpdate(entry.doc);
  }

  // snapshot을 적용 whiteboard는 snapshot을 0으로 리셋하면 성능적인 문제가 크게 발생한다.
  applySnapshot(room_id: string, snapshotUpdate: Uint8Array): void {
    const entry = this.ensure(room_id);

    // 새 doc에서
    const newDoc = new Y.Doc();
    Y.applyUpdate(newDoc, snapshotUpdate);

    entry.doc = newDoc;
    entry.baseSeq = entry.seq; // snap shot을 찍었을때 변경 사항

    // 새롭게 업데이트
    entry.ring = new Array<UpdateEntry | undefined>(entry.ringSize);
  }

  // 스냅샷 작성 시기에 대해서 체크
  markSnapshot(room_id: string, snapSeq: number) {
    const entry = this.ensure(room_id);
    entry.baseSeq = Math.max(entry.baseSeq, snapSeq);
    entry.ring = new Array<UpdateEntry | undefined>(entry.ringSize);
  }

  // room_id 삭제 ( 나중에 구현 )
  delete(room_id: string): void {
    this.roomDocs.delete(room_id);
  }
}
