import { useEffect, useRef } from 'react';
import * as Y from 'yjs';
import * as awarenessProtocol from 'y-protocols/awareness';
import { Socket } from 'socket.io-client';
import { useWhiteboardSharedStore } from '@/store/useWhiteboardSharedStore';
import { useWhiteboardLocalStore } from '@/store/useWhiteboardLocalStore';
import { useWhiteboardAwarenessStore } from '@/store/useWhiteboardAwarenessStore';
import { useUserStore } from '@/store/useUserStore';
import { NO_TRANSPARENT_PALETTE } from '@/constants/colors';
import type { WhiteboardItem } from '@/types/whiteboard';
import type { YMapValue } from '@/types/whiteboard/yjs';

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

const normalizeToU8 = (v: ArrayBuffer | Uint8Array): Uint8Array =>
  v instanceof Uint8Array ? v : new Uint8Array(v);

export const useWhiteboardYjs = (socket: Socket | null) => {
  const undoManagerRef = useRef<Y.UndoManager | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const initializedRef = useRef(false);

  // ✅ 서버 seq 추적 (request-sync 복구에 사용)
  const serverSeqRef = useRef<number>(0);
  const syncingRef = useRef(false);

  const setItems = useWhiteboardSharedStore((state) => state.setItems);
  const { nickname } = useUserStore();

  useEffect(() => {
    if (initializedRef.current) return;
    if (!socket?.connected) return;

    console.log('[Yjs] 초기화 시작, 소켓 ID:', socket.id);
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

    // ✅ (추가) cursor 콜백도 동일한 방식으로 연결
    // - store에 setCursorCallback 같은게 없다면, 아래 부분은 너희 store 네이밍에 맞춰 1줄만 바꾸면 됨
    const updateAwarenessCursor = (cursor: { x: number; y: number } | null) => {
      const currentState = awareness.getLocalState();
      if (!currentState) return;

      awareness.setLocalState({
        ...currentState,
        cursor,
      });
    };

    // 너희 LocalStore에 cursor용 콜백 setter가 이미 있으면 이걸로 연결해줘
    // (없으면, 아래 줄은 주석처리하고 커서 업데이트는 컴포넌트에서 직접 updateAwarenessCursor를 호출하는 방식으로 해도 됨)
    // @ts-ignore - 프로젝트에 맞는 함수명으로 바꿔
    useWhiteboardLocalStore.getState().setCursorCallback?.(updateAwarenessCursor);

    // -------------------------
    // Server -> Client : yjs-init
    // -------------------------
    const onYjsInit = (payload: YjsInitPayload) => {
      try {
        const u8 = normalizeToU8(payload.update);
        Y.applyUpdate(ydoc, u8, 'remote-init');

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
    // Server -> Yjs : yjs-update
    // (서버가 {update, seq} 보내는 구조 지원)
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

        // ✅ seq mismatch 감지 → request-sync
        if (typeof seq === 'number') {
          const expected = serverSeqRef.current + 1;
          if (serverSeqRef.current > 0 && seq !== expected) {
            console.warn('[Yjs] seq mismatch', {
              expected,
              got: seq,
              last_seq: serverSeqRef.current,
            });
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
    // request-sync 복구: yjs-sync-full / delta / ok
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

    // ✅ observeDeep를 바로 handleYjsChange에 연결하지 말고,
    // ✅ raf로 한 프레임에 한 번만 setItems 하도록 한다.
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
    // Awareness change -> store 반영 (기존 의도 유지)
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

    console.log('[Yjs] 초기화 완료');

    // -------------------------
    // cleanup
    // -------------------------
    cleanupRef.current = () => {
      initializedRef.current = false;
      syncingRef.current = false;
      serverSeqRef.current = 0;

      undoManagerRef.current?.destroy();

      useWhiteboardSharedStore.getState().setYjsInstances(null, null, null, null);
      useWhiteboardLocalStore.getState().setAwarenessCallback(null);
      // @ts-ignore
      useWhiteboardLocalStore.getState().setCursorCallback?.(null);

      yItems.unobserveDeep(schedule);

      awareness.off('update', onAwarenessUpdateLocal);
      awareness.off('change', onAwarenessChange);

      socket.off('init-user', onInitUser);
      socket.off('yjs-init', onYjsInit);
      socket.off('yjs-update', onYjsUpdate);

      socket.off('yjs-sync-full', onSyncFull);
      socket.off('yjs-sync-delta', onSyncDelta);
      socket.off('yjs-sync-ok', onSyncOk);

      socket.off('awareness-update', onAwarenessUpdateRemote);

      ydoc.off('update', onDocUpdate);
      ydoc.destroy();
    };
  }, [socket, setItems, nickname]);

  useEffect(() => {
    return () => cleanupRef.current?.();
  }, []);
};
