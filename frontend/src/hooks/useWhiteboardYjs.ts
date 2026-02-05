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
  CLIENT_READY: 'whiteboard:ws:yjs-ready',
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

  // 서버 seq 추적 (request-sync 복구에 사용)
  const serverSeqRef = useRef<number>(0);
  const syncingRef = useRef(false);

  const readySentRef = useRef(false);

  const setItems = useWhiteboardSharedStore((state) => state.setItems);
  const { nickname } = useUserStore();

  useEffect(() => {
    if (initializedRef.current) return;
    if (!socket?.connected) return;

    initializedRef.current = true;

    // Yjs / Awareness 기본 세팅
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

    // CLIENT_READY 전송 로직
    // - 서버가 이걸 받아야 yjs-init을 내려줌
    // - permission 이후 / connect 이후 / reconnect 이후 안전하게 한 번만 보내기
    const sendReadyOnce = () => {
      if (!socket?.connected) return;
      if (readySentRef.current) return;

      readySentRef.current = true;
      socket.emit(WHITEBOARD_EVENT_NAME.CLIENT_READY); // "whiteboard:ws:yjs-ready"
    };

    // 연결된 즉시 한 번 시도 (permission이 더 늦게 오면 아래 onPermission에서 다시 한번 시도)
    sendReadyOnce();

    // sync helper
    const requestSync = (last_seq: number) => {
      if (!socket?.connected) return;
      if (syncingRef.current) return;
      syncingRef.current = true;

      socket.emit('request-sync', { last_seq });

      // 응답이 없으면 잠금 해제
      window.setTimeout(() => {
        syncingRef.current = false;
      }, 1500);
    };

    // init-user
    const onInitUser = ({ userId }: { userId: string }) => {
      useWhiteboardAwarenessStore.getState().setMyUserId(userId);

      const colorPalette = NO_TRANSPARENT_PALETTE.filter(
        (color) =>
          color !== '#ffffff' && color !== '#343a40' && color !== '#adb5bd',
      );
      const randomColor =
        colorPalette[Math.floor(Math.random() * colorPalette.length)];

      awareness.setLocalState({
        user: {
          id: userId,
          name: nickname || '알 수 없음',
          color: randomColor,
        },
        cursor: null,
        selectedIds: [],
      });
    };
    socket.on('init-user', onInitUser);

    // permission 받고 ready 보내는 흐름(서버에서 PERMISSION을 emit하고 있음)
    const onPermission = ({ ok }: { ok: boolean }) => {
      if (!ok) return;
      sendReadyOnce();
    };
    socket.on(WHITEBOARD_CLIENT_EVENT_NAME.PERMISSION, onPermission);

    // 재연결 시 ready 다시 보내야 함
    const onReconnect = () => {
      // reconnect면 서버 소켓 객체가 바뀌어서 다시 ready 필요
      readySentRef.current = false;
      sendReadyOnce();
    };
    socket.on('reconnect', onReconnect);
    socket.on('connect', onReconnect); // socket.io는 connect에도 대응해두면 안정적

    // 사용자 연결 해제 처리
    const onUserDisconnected = ({ userId }: { userId: string }) => {
      useWhiteboardAwarenessStore.getState().removeUser(userId);
    };
    socket.on('user-disconnected', onUserDisconnected);

    // 내 소켓이 끊어졌을 때 처리
    const onDisconnect = () => {
      if (awareness) {
        awareness.setLocalState(null);
      }
    };
    socket.on('disconnect', onDisconnect);

    // selection 콜백
    const updateAwarenessSelection = (selectedIds: string[]) => {
      const currentState = awareness.getLocalState();
      if (!currentState) return;

      awareness.setLocalState({
        ...currentState,
        selectedIds,
      });
    };
    useWhiteboardLocalStore
      .getState()
      .setAwarenessCallback(updateAwarenessSelection);

    const updateAwarenessCursor = (cursor: { x: number; y: number } | null) => {
      const currentState = awareness.getLocalState();
      if (!currentState) return;

      awareness.setLocalState({
        ...currentState,
        cursor,
      });
    };

    useWhiteboardLocalStore.getState().setCursorCallback(updateAwarenessCursor);

    // Server -> Client : yjs-init
    const onYjsInit = (payload: YjsInitPayload) => {
      try {
        Y.applyUpdate(ydoc, normalizeToU8(payload.update), 'remote-init');

        if (typeof payload.seq === 'number') {
          serverSeqRef.current = payload.seq;
        }
      } catch (e) {
        requestSync(0);
      }
    };
    socket.on('yjs-init', onYjsInit);

    // Yjs -> Server : update (기존 의도 유지)
    const onDocUpdate = (
      update: Uint8Array,
      origin: string | Y.UndoManager | null,
    ) => {
      // 로컬 변경 / undo redo / cleanup만 서버로 전송
      if (
        origin === yjsOrigin ||
        origin === undoManager ||
        origin === 'cleanup'
      ) {
        socket.emit('yjs-update', update);
      }
    };
    ydoc.on('update', onDocUpdate);

    // Server -> Yjs : yjs-update (seq 포함 지원)
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
        requestSync(serverSeqRef.current);
      }
    };
    socket.on('yjs-update', onYjsUpdate);

    // request-sync 복구
    const onSyncFull = (payload: YjsSyncFullPayload) => {
      try {
        Y.applyUpdate(ydoc, normalizeToU8(payload.update), 'remote-full');
        serverSeqRef.current = payload.seq;
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

    // Awareness 동기화
    const onAwarenessUpdateLocal = ({
      added,
      updated,
      removed,
    }: {
      added: number[];
      updated: number[];
      removed: number[];
    }) => {
      const changed = added.concat(updated, removed);
      if (changed.length === 0) return;

      const u = awarenessProtocol.encodeAwarenessUpdate(awareness, changed);
      socket.emit('awareness-update', u);
    };
    awareness.on('update', onAwarenessUpdateLocal);

    const onAwarenessUpdateRemote = (update: ArrayBuffer) => {
      try {
        awarenessProtocol.applyAwarenessUpdate(
          awareness,
          new Uint8Array(update),
          'remote',
        );
      } catch (e) {
        // Awareness 업데이트 실패 시 무시
      }
    };
    socket.on('awareness-update', onAwarenessUpdateRemote);

    // Yjs Array -> SharedStore (손글씨/드로잉 때문에 setItems를 raf throttle)
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

    // 한 프레임에 한 번만 setItems
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

    // Awareness change -> store 반영
    const onAwarenessChange = ({
      added,
      updated,
    }: {
      added: number[];
      updated: number[];
    }) => {
      const states = awareness.getStates();

      // 추가/업데이트된 사용자 처리
      [...added, ...updated].forEach((clientId) => {
        if (clientId === ydoc.clientID) return;

        const state = states.get(clientId);
        if (state?.user) {
          useWhiteboardAwarenessStore.getState().updateUser(state.user.id, {
            id: state.user.id,
            name: state.user.name,
            color: state.user.color,
            cursor: state.cursor || null,
            selectedIds: state.selectedIds || [],
          });
        }
      });

      // 타임아웃된 사용자 제거
      const currentUsers = useWhiteboardAwarenessStore.getState().users;
      const activeUserIds = new Set<string>();

      states.forEach((s) => {
        if (s?.user?.id) activeUserIds.add(s.user.id);
      });

      currentUsers.forEach((_, userId) => {
        if (!activeUserIds.has(userId)) {
          useWhiteboardAwarenessStore.getState().removeUser(userId);
        }
      });
    };
    awareness.on('change', onAwarenessChange);

    cleanupRef.current = () => {
      initializedRef.current = false;
      syncingRef.current = false;
      serverSeqRef.current = 0;
      readySentRef.current = false;

      undoManagerRef.current?.destroy();

      useWhiteboardSharedStore
        .getState()
        .setYjsInstances(null, null, null, null);
      useWhiteboardLocalStore.getState().setAwarenessCallback(null);
      useWhiteboardLocalStore.getState().setCursorCallback(null);

      yItems.unobserveDeep(schedule);

      awareness.off('update', onAwarenessUpdateLocal);
      awareness.off('change', onAwarenessChange);

      socket.off('init-user', onInitUser);
      socket.off(WHITEBOARD_CLIENT_EVENT_NAME.PERMISSION, onPermission);

      socket.off('yjs-init', onYjsInit);
      socket.off('yjs-update', onYjsUpdate);

      socket.off('yjs-sync-full', onSyncFull);
      socket.off('yjs-sync-delta', onSyncDelta);
      socket.off('yjs-sync-ok', onSyncOk);

      socket.off('awareness-update', onAwarenessUpdateRemote);

      socket.off('reconnect', onReconnect);
      socket.off('connect', onReconnect);
      socket.off('user-disconnected', onUserDisconnected);
      socket.off('disconnect', onDisconnect);

      ydoc.off('update', onDocUpdate);
      ydoc.destroy();

      // 모든 사용자 정보 정리
      useWhiteboardAwarenessStore.getState().setUsers(new Map());
    };
  }, [socket, setItems, nickname]);

  useEffect(() => {
    return () => cleanupRef.current?.();
  }, []);
};
