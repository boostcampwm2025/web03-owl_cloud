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

export const useWhiteboardYjs = (socket: Socket | null) => {
  const undoManagerRef = useRef<Y.UndoManager | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const initializedRef = useRef(false);

  const setItems = useWhiteboardSharedStore((state) => state.setItems);
  const { nickname } = useUserStore();

  useEffect(() => {
    if (initializedRef.current) {
      return;
    }

    if (!socket?.connected) {
      return;
    }

    console.log('[Yjs] 초기화 시작, 소켓 ID:', socket.id);
    initializedRef.current = true;

    // Yjs 문서 생성
    const ydoc = new Y.Doc();
    const yItems = ydoc.getArray<Y.Map<YMapValue>>('items');
    const awareness = new awarenessProtocol.Awareness(ydoc);

    // 고유 origin 생성 (UndoManager 추적용)
    const yjsOrigin = `local-${socket.id}`;

    // UndoManager 생성
    const undoManager = new Y.UndoManager(yItems, {
      trackedOrigins: new Set([yjsOrigin]), // 로컬 변경만 추적
      captureTimeout: 500, // 하나의 작업으로 묶을 시간(ms)
    });
    // UndoManager 자신의 변경도 추적 (undo/redo 동기화용)
    undoManager.trackedOrigins.add(undoManager);

    undoManagerRef.current = undoManager;

    // Store에 Yjs 인스턴스 저장
    useWhiteboardSharedStore
      .getState()
      .setYjsInstances(yItems, awareness, undoManager, yjsOrigin);

    // Backend에서 사용자 ID 받기
    socket.on('init-user', ({ userId }: { userId: string }) => {
      useWhiteboardAwarenessStore.getState().setMyUserId(userId);

      // 팔레트에서 랜덤 색상 선택 (흰색, 검정, 회색 제외)
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
        selectedId: null,
      });
    });

    // selectItem 시 awareness 업데이트
    const updateAwarenessSelection = (selectedId: string | null) => {
      const currentState = awareness.getLocalState();
      if (currentState) {
        awareness.setLocalState({
          ...currentState,
          selectedId,
        });
      }
    };

    // LocalStore에 콜백 등록
    useWhiteboardLocalStore
      .getState()
      .setAwarenessCallback(updateAwarenessSelection);

    // Yjs → Socket
    ydoc.on(
      'update',
      (update: Uint8Array, origin: string | Y.UndoManager | null) => {
        // 로컬 변경, UndoManager 변경, cleanup 모두 전송
        if (
          origin === yjsOrigin ||
          origin === undoManager ||
          origin === 'cleanup'
        ) {
          socket.emit('yjs-update', update);
        }
      },
    );

    // Socket → Yjs
    socket.on('yjs-update', (update: ArrayBuffer) => {
      Y.applyUpdate(ydoc, new Uint8Array(update), 'remote');
    });

    // Awareness 동기화
    awareness.on('update', () => {
      const update = awarenessProtocol.encodeAwarenessUpdate(awareness, [
        ydoc.clientID,
      ]);
      socket.emit('awareness-update', update);
    });

    socket.on('awareness-update', (update: ArrayBuffer) => {
      awarenessProtocol.applyAwarenessUpdate(
        awareness,
        new Uint8Array(update),
        'remote',
      );
    });

    // 중간 입장하면 전체 상태 전송
    socket.on('request-sync', () => {
      const fullUpdate = Y.encodeStateAsUpdate(ydoc);
      socket.emit('yjs-update', fullUpdate);
    });

    // Yjs Array → SharedStore
    const handleYjsChange = () => {
      const yMaps = yItems.toArray();

      // 중복 제거
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

      // 중복 데이터를 Yjs에서 삭제
      if (indexesToDelete.length > 0) {
        ydoc.transact(() => {
          indexesToDelete.reverse().forEach((index) => {
            yItems.delete(index, 1);
          });
        }, 'cleanup');
      }

      // UI 업데이트
      setItems(uniqueItems);
    };

    // Y.Array 내부 map 변경 감지
    yItems.observeDeep(handleYjsChange);

    handleYjsChange();

    // Awareness 변경 감지
    awareness.on('change', () => {
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
    });

    console.log('[Yjs] 초기화 완료');

    cleanupRef.current = () => {
      initializedRef.current = false;
      undoManagerRef.current?.destroy();
      useWhiteboardSharedStore
        .getState()
        .setYjsInstances(null, null, null, null);
      useWhiteboardLocalStore.getState().setAwarenessCallback(null);
      yItems.unobserveDeep(handleYjsChange);
      socket.off('yjs-update');
      socket.off('awareness-update');
      socket.off('request-sync');
      socket.off('init-user');
      ydoc.destroy();
    };
  }, [socket, setItems]);

  useEffect(() => {
    return () => cleanupRef.current?.();
  }, []);
};
