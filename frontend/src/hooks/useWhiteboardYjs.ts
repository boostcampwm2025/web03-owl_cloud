import { useEffect, useRef } from 'react';
import * as Y from 'yjs';
import * as awarenessProtocol from 'y-protocols/awareness';
import type { Socket } from 'socket.io-client';

import { useWhiteboardSharedStore } from '@/store/useWhiteboardSharedStore';
import { useWhiteboardLocalStore } from '@/store/useWhiteboardLocalStore';
import { useWhiteboardAwarenessStore } from '@/store/useWhiteboardAwarenessStore';
import { useUserStore } from '@/store/useUserStore';
import { NO_TRANSPARENT_PALETTE } from '@/constants/colors';
import type { WhiteboardItem } from '@/types/whiteboard';
import type { YMapValue } from '@/types/whiteboard/yjs';
// ↑ 예시야. 실제 너희 프로젝트에서 WHITEBOARD_EVENT_NAME.CLIENT_READY 를 import 가능한 경로로 바꿔.

type YjsInitPayload = {
  update: ArrayBuffer | Uint8Array;
  seq?: number;
  origin?: string;
};

// 서버가 보내는 yjs-update는 (Buffer) or ({update, seq})
type YjsUpdatePayload =
  | ArrayBuffer
  | Uint8Array
  | {
      update: ArrayBuffer | Uint8Array;
      seq?: number;
    };

type YjsSyncFullPayload = {
  update: ArrayBuffer | Uint8Array;
  seq: number;
  origin?: string;
};

type YjsSyncDeltaPayload = {
  from: number;
  to: number;
  updates: Array<ArrayBuffer | Uint8Array>;
  origin?: string;
};

type YjsSyncOkPayload = {
  ok: boolean;
  seq?: number;
};

export const WHITEBOARD_EVENT_NAME = Object.freeze({
  HEALTH_CHECK: 'whiteboard:ws:health_check',
  CLIENT_READY : "whiteboard:ws:yjs-ready",
  CREATE_ELEMENT: 'whiteboard:element:create',
  UPDATE_ELEMENT: 'whiteboard:element:update',
  DELETE_ELEMENT: 'whiteboard:element:delete',
  CHANGE_LAYER: 'whiteboard:element:layer',
  CURSOR_MOVE: 'whiteboard:cursor:move',
} as const);

export const WHITEBOARD_CLIENT_EVENT_NAME = Object.freeze({
  PERMISSION: 'whiteboard:permission',

  REMOTE_CREATE_ELEMENT: 'whiteboard:remote:element:create',
  REMOTE_UPDATE_ELEMENT: 'whiteboard:remote:element:update',
  REMOTE_DELETE_ELEMENT: 'whiteboard:remote:element:delete',
  REMOTE_CHANGE_LAYER: 'whiteboard:remote:element:layer',
  REMOTE_CURSOR_MOVE: 'whiteboard:remote:cursor:move',
} as const);

const normalizeToU8 = (v: ArrayBuffer | Uint8Array): Uint8Array =>
  v instanceof Uint8Array ? v : new Uint8Array(v);

export const useWhiteboardYjs = (socket: Socket | null) => {
  const cleanupRef = useRef<(() => void) | null>(null);
  const initializedRef = useRef(false);

  const undoManagerRef = useRef<Y.UndoManager | null>(null);

  // ✅ 서버 seq 추적 (request-sync 복구에 사용)
  const serverSeqRef = useRef<number>(0);
  const syncingRef = useRef(false);

  // ✅ ready는 “한 번만”
  const readySentRef = useRef(false);

  const setItems = useWhiteboardSharedStore((state) => state.setItems);
  const { nickname } = useUserStore();

  useEffect(() => {
    if (initializedRef.current) return;
    if (!socket?.connected) return;

    initializedRef.current = true;

    // -------------------------
    // Yjs / Awareness 기본 세팅
    // -------------------------
    const ydoc = new Y.Doc();
    const yItems = ydoc.getArray<Y.Map<YMapValue>>('items');
    const awareness = new awarenessProtocol.Awareness(ydoc);

    const yjsOrigin = `local-${socket.id}`;

    const undoManager = new Y.UndoManager(yItems, {
      trackedOrigins: new Set([yjsOrigin]),
      captureTimeout: 500,
    });
    undoManager.trackedOrigins.add(undoManager);
    undoManagerRef.current = undoManager;

    useWhiteboardSharedStore
      .getState()
      .setYjsInstances(yItems, awareness, undoManager, yjsOrigin);

    // -------------------------
    // ✅ CLIENT_READY 전송 로직 (핵심)
    // - 서버가 이걸 받아야 yjs-init을 내려줌
    // - permission 이후 / connect 이후 / reconnect 이후 안전하게 한 번만 보내기
    // -------------------------
    const sendReadyOnce = () => {
      if (!socket?.connected) return;
      if (readySentRef.current) return;

      readySentRef.current = true;
      socket.emit(WHITEBOARD_EVENT_NAME.CLIENT_READY); // "whiteboard:ws:yjs-ready"
    };

    // 연결된 즉시 한 번 시도 (permission이 더 늦게 오면 아래 onPermission에서 다시 한번 시도)
    sendReadyOnce();

    // -------------------------
    // sync helper
    // -------------------------
    const requestSync = (last_seq: number) => {
      if (!socket?.connected) return;
      if (syncingRef.current) return;
      syncingRef.current = true;

      socket.emit('request-sync', { last_seq });

      // 안전장치(응답이 없으면 잠금 해제)
      window.setTimeout(() => {
        syncingRef.current = false;
      }, 1500);
    };

    // -------------------------
    // init-user (기존 의도 유지)
    // -------------------------
    const onInitUser = ({ userId }: { userId: string }) => {
      useWhiteboardAwarenessStore.getState().setMyUserId(userId);

      const colorPalette = NO_TRANSPARENT_PALETTE.filter(
        (color) => color !== '#ffffff' && color !== '#343a40' && color !== '#adb5bd',
      );
      const randomColor = colorPalette[Math.floor(Math.random() * colorPalette.length)];

      awareness.setLocalState({
        user: {
          id: userId,
          name: nickname || '알 수 없음',
          color: randomColor,
        },
        cursor: null,
        selectedId: null,
      });
    };
    socket.on('init-user', onInitUser);

    // ✅ permission 받고 ready 보내는 흐름을 원래 의도에 맞춰 추가
    // (서버에서 PERMISSION을 emit하고 있음)
    const onPermission = ({ ok }: { ok: boolean }) => {
      if (!ok) return;
      // permission 받은 이후 ready 보내는 게 가장 안정적
      sendReadyOnce();
    };
    socket.on(WHITEBOARD_CLIENT_EVENT_NAME.PERMISSION as any, onPermission);
    // ↑ 타입 안 맞으면 as any 제거하고 상수 타입 맞춰줘

    // ✅ 재연결 시 ready 다시 보내야 함
    const onReconnect = () => {
      // reconnect면 서버 소켓 객체가 바뀌어서 다시 ready 필요
      readySentRef.current = false;
      sendReadyOnce();
    };
    socket.on('reconnect', onReconnect);
    socket.on('connect', onReconnect); // socket.io는 connect에도 대응해두면 안정적

    // -------------------------
    // selection 콜백 (기존 의도 유지)
    // -------------------------
    const updateAwarenessSelection = (selectedId: string | null) => {
      const currentState = awareness.getLocalState();
      if (!currentState) return;

      awareness.setLocalState({
        ...currentState,
        selectedId,
      });
    };
    useWhiteboardLocalStore.getState().setAwarenessCallback(updateAwarenessSelection);

    // ✅ cursor 콜백도 동일하게 연결 (커서 안되던 핵심 구간)
    // - LocalStore에 setter가 없다면, store에 추가하거나
    // - 커서 발생 컴포넌트에서 awareness.setLocalStateField('cursor', ...) 직접 호출해야 함
    const updateAwarenessCursor = (cursor: { x: number; y: number } | null) => {
      const currentState = awareness.getLocalState();
      if (!currentState) return;

      awareness.setLocalState({
        ...currentState,
        cursor,
      });
    };

    // 프로젝트에 맞는 네이밍으로 바꿔줘 (없으면 store에 추가하는 게 정석)
    // @ts-ignore
    useWhiteboardLocalStore.getState().setCursorCallback?.(updateAwarenessCursor);

    // -------------------------
    // Server -> Client : yjs-init
    // -------------------------
    const onYjsInit = (payload: YjsInitPayload) => {
      try {
        Y.applyUpdate(ydoc, normalizeToU8(payload.update), 'remote-init');

        if (typeof payload.seq === 'number') {
          serverSeqRef.current = payload.seq;
        }
      } catch (e) {
        console.error('[Yjs] yjs-init apply error', e);
      }
    };
    socket.on('yjs-init', onYjsInit);

    // -------------------------
    // Yjs -> Server : update (기존 의도 유지)
    // -------------------------
    const onDocUpdate = (update: Uint8Array, origin: string | Y.UndoManager | null) => {
      // 로컬 변경 / undo redo / cleanup만 서버로 전송
      if (origin === yjsOrigin || origin === undoManager || origin === 'cleanup') {
        socket.emit('yjs-update', update);
      }
    };
    ydoc.on('update', onDocUpdate);

    // -------------------------
    // Server -> Yjs : yjs-update (seq 포함 지원)
    // -------------------------
    const onYjsUpdate = (payload: YjsUpdatePayload) => {
      try {
        let update: ArrayBuffer | Uint8Array;
        let seq: number | undefined;

        if (payload instanceof ArrayBuffer || payload instanceof Uint8Array) {
          update = payload;
        } else {
          update = payload.update;
          seq = payload.seq;
        }

        // seq mismatch 감지 → request-sync
        if (typeof seq === 'number') {
          const expected = serverSeqRef.current + 1;
          if (serverSeqRef.current > 0 && seq !== expected) {
            requestSync(serverSeqRef.current);
          }
          serverSeqRef.current = seq;
        }

        Y.applyUpdate(ydoc, normalizeToU8(update), 'remote');
      } catch (e) {
        console.error('[Yjs] yjs-update apply error', e);
        requestSync(serverSeqRef.current);
      }
    };
    socket.on('yjs-update', onYjsUpdate);

    // -------------------------
    // request-sync 복구
    // -------------------------
    const onSyncFull = (payload: YjsSyncFullPayload) => {
      try {
        Y.applyUpdate(ydoc, normalizeToU8(payload.update), 'remote-full');
        serverSeqRef.current = payload.seq;
      } catch (e) {
        console.error('[Yjs] yjs-sync-full apply error', e);
      } finally {
        syncingRef.current = false;
      }
    };
    socket.on('yjs-sync-full', onSyncFull);

    const onSyncDelta = (payload: YjsSyncDeltaPayload) => {
      try {
        for (const u of payload.updates) {
          Y.applyUpdate(ydoc, normalizeToU8(u), 'remote-delta');
        }
        serverSeqRef.current = payload.to;
      } catch (e) {
        console.error('[Yjs] yjs-sync-delta apply error', e);
        requestSync(serverSeqRef.current);
      } finally {
        syncingRef.current = false;
      }
    };
    socket.on('yjs-sync-delta', onSyncDelta);

    const onSyncOk = (payload: YjsSyncOkPayload) => {
      if (typeof payload.seq === 'number') {
        serverSeqRef.current = payload.seq;
      }
      syncingRef.current = false;
    };
    socket.on('yjs-sync-ok', onSyncOk);

    // -------------------------
    // Awareness 동기화 (안정형)
    // -------------------------
    const onAwarenessUpdateLocal = ({ added, updated, removed }: any) => {
      const changed = (added as number[]).concat(updated as number[], removed as number[]);
      if (changed.length === 0) return;

      const u = awarenessProtocol.encodeAwarenessUpdate(awareness, changed);
      socket.emit('awareness-update', u);
    };
    awareness.on('update', onAwarenessUpdateLocal);

    const onAwarenessUpdateRemote = (update: ArrayBuffer) => {
      try {
        awarenessProtocol.applyAwarenessUpdate(awareness, new Uint8Array(update), 'remote');
      } catch (e) {
        console.error('[Yjs] awareness-update apply error', e);
      }
    };
    socket.on('awareness-update', onAwarenessUpdateRemote);

    // -------------------------
    // Yjs Array -> SharedStore
    // (손글씨/드로잉 때문에 setItems를 raf throttle)
    // -------------------------
    const handleYjsChange = () => {
      const yMaps = yItems.toArray();

      const seenIds = new Set<string>();
      const uniqueItems: WhiteboardItem[] = [];
      const indexesToDelete: number[] = [];

      yMaps.forEach((yMap, index) => {
        const item = yMap.toJSON() as WhiteboardItem;

        if (seenIds.has(item.id)) {
          indexesToDelete.push(index);
        } else {
          seenIds.add(item.id);
          uniqueItems.push(item);
        }
      });

      if (indexesToDelete.length > 0) {
        ydoc.transact(() => {
          indexesToDelete.reverse().forEach((index) => {
            yItems.delete(index, 1);
          });
        }, 'cleanup');
      }

      setItems(uniqueItems);
    };

    // ✅ 한 프레임에 한 번만 setItems
    let dirty = false;
    const schedule = () => {
      if (dirty) return;
      dirty = true;
      requestAnimationFrame(() => {
        dirty = false;
        handleYjsChange();
      });
    };

    yItems.observeDeep(schedule);
    handleYjsChange();

    // -------------------------
    // Awareness change -> store 반영
    // -------------------------
    const onAwarenessChange = () => {
      const states = awareness.getStates();
      states.forEach((state, clientId) => {
        if (clientId === ydoc.clientID) return;

        if (state.user) {
          useWhiteboardAwarenessStore.getState().updateUser(state.user.id, {
            id: state.user.id,
            name: state.user.name,
            color: state.user.color,
            cursor: state.cursor || null,
            selectedId: state.selectedId || null,
          });
        }
      });
    };
    awareness.on('change', onAwarenessChange);

    // -------------------------
    // cleanup
    // -------------------------
    cleanupRef.current = () => {
      initializedRef.current = false;
      syncingRef.current = false;
      serverSeqRef.current = 0;
      readySentRef.current = false;

      undoManagerRef.current?.destroy();

      useWhiteboardSharedStore.getState().setYjsInstances(null, null, null, null);
      useWhiteboardLocalStore.getState().setAwarenessCallback(null);
      // @ts-ignore
      useWhiteboardLocalStore.getState().setCursorCallback?.(null);

      yItems.unobserveDeep(schedule);

      awareness.off('update', onAwarenessUpdateLocal);
      awareness.off('change', onAwarenessChange);

      socket.off('init-user', onInitUser);
      socket.off(WHITEBOARD_CLIENT_EVENT_NAME.PERMISSION as any, onPermission);

      socket.off('yjs-init', onYjsInit);
      socket.off('yjs-update', onYjsUpdate);

      socket.off('yjs-sync-full', onSyncFull);
      socket.off('yjs-sync-delta', onSyncDelta);
      socket.off('yjs-sync-ok', onSyncOk);

      socket.off('awareness-update', onAwarenessUpdateRemote);

      socket.off('reconnect', onReconnect);
      socket.off('connect', onReconnect);

      ydoc.off('update', onDocUpdate);
      ydoc.destroy();
    };
  }, [socket, setItems, nickname]);

  useEffect(() => {
    return () => cleanupRef.current?.();
  }, []);
};
