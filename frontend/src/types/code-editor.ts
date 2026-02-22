import { EditorLanguage } from '@/constants/code-editor';
import type { RefObject } from 'react';
import type { Socket } from 'socket.io-client';
import type * as monaco from 'monaco-editor';
import type * as Y from 'yjs';
import type * as awarenessProtocol from 'y-protocols/awareness';

export type CursorState = {
  lineNumber: number;
  column: number;
};

export type UserRole = 'viewer' | 'presenter';

export type UserState = {
  name: string;
  role: UserRole;
};

export type LanguageState = {
  value: EditorLanguage;
  updatedAt: number;
  updatedBy: number; // clientID
};

export type AwarenessState = {
  user?: UserState;
  cursor?: CursorState | null;
};

export type MonacoNamespace = typeof import('monaco-editor');

export type YjsProviderRef = {
  ydoc: Y.Doc;
  awareness: awarenessProtocol.Awareness;
};

export type SyncState = {
  lastSeq: number;
  awaitingAck: boolean;
  suppressSend: boolean;
  dirty: boolean;
  syncReqInFlight: boolean;
  readySent: boolean;
  lastSendAt: number;
};

export type UseCodeEditorSessionParams = {
  autoComplete: boolean;
  minimap: boolean;
  onlyMyCursor: boolean;
  nickname: string;
  socket: Socket | null;
};

export type CursorCollectionsRef = RefObject<
  Map<number, monaco.editor.IEditorDecorationsCollection>
>;

/* Yjs - payload 및 요구타입 정의 */

export type YjsInitPayload = {
  update: ArrayBuffer;
  seq: number;
  origin?: 'INIT';
};

export type YjsRemoteUpdateSingle = { seq: number; update: ArrayBuffer };
export type YjsRemoteUpdateBatch = {
  from_seq: number;
  to_seq: number;
  updates: ArrayBuffer[];
};
export type YjsRemoteUpdate = YjsRemoteUpdateSingle | YjsRemoteUpdateBatch;

export type YjsSyncOrigin = 'UPDATE_REJECTED' | 'SYNC_REQ' | 'INIT';

export type YjsSyncServerPayload =
  | { type: 'ack'; ok: true; server_seq: number; origin?: YjsSyncOrigin }
  | {
      type: 'patch';
      ok: true;
      from_seq: number;
      to_seq: number;
      updates: ArrayBuffer[];
      server_seq: number;
      origin: YjsSyncOrigin;
    }
  | {
      type: 'full';
      ok: true;
      server_seq: number;
      update: ArrayBuffer;
      origin: YjsSyncOrigin;
    }
  | {
      type: 'error';
      ok: false;
      code: 'BAD_PAYLOAD' | 'ROOM_NOT_FOUND' | 'INTERNAL';
      message?: string;
      origin?: YjsSyncOrigin;
    };

export type YjsSyncReqPayload = {
  last_seq: number;
  reason?: 'SEQ_GAP' | 'MANUAL' | 'UNKNOWN' | 'INIT';
};

export type YjsUpdateClientPayload = {
  last_seq: number;
  update?: Uint8Array;
  updates?: Uint8Array[];
};
