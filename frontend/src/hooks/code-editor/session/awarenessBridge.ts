import type { RefObject } from 'react';
import type * as monaco from 'monaco-editor';
import type * as Y from 'yjs';
import type * as awarenessProtocol from 'y-protocols/awareness';
import type { Socket } from 'socket.io-client';
import * as awarenessProtocolRuntime from 'y-protocols/awareness';

import type {
  AwarenessState,
  CursorCollectionsRef,
  MonacoNamespace,
} from '@/types/code-editor';
import { colorFromClientId, injectCursorStyles } from '@/utils/code-editor';

type SetupAwarenessBridgeParams = {
  awareness: awarenessProtocol.Awareness;
  ydoc: Y.Doc;
  socket: Socket;
  editor: monaco.editor.IStandaloneCodeEditor;
  monacoNs: MonacoNamespace;
  nickname: string;
  onlyMyCursorRef: RefObject<boolean>;
  cursorCollectionsRef: CursorCollectionsRef;
  setHasPresenter: (value: boolean) => void;
  setIsPresenter: (value: boolean) => void;
};

export const setupAwarenessBridge = ({
  awareness,
  ydoc,
  socket,
  editor,
  monacoNs,
  nickname,
  onlyMyCursorRef,
  cursorCollectionsRef,
  setHasPresenter,
  setIsPresenter,
}: SetupAwarenessBridgeParams) => {
  awareness.setLocalState({
    user: {
      name: nickname || '알 수 없음',
      role: 'viewer',
      color: colorFromClientId(ydoc.clientID).cursor,
    },
    cursor: null,
  });

  const updateRemoteDecorations = (states: Map<number, AwarenessState>) => {
    const onlyMine = onlyMyCursorRef.current;
    const collections = cursorCollectionsRef.current;
    const myId = awareness.clientID;

    if (onlyMine) {
      collections.forEach((collection) => collection.clear());
      return;
    }

    for (const [clientId, state] of states.entries()) {
      if (clientId === myId) continue;

      if (!state.cursor) {
        collections.get(clientId)?.clear();
        continue;
      }

      const { lineNumber, column } = state.cursor;

      if (!collections.has(clientId)) {
        collections.set(clientId, editor.createDecorationsCollection());
      }

      const collection = collections.get(clientId);
      if (!collection) continue;

      const { cursor } = colorFromClientId(clientId);
      const displayedUserName = state.user?.name ?? 'User';

      injectCursorStyles(clientId, cursor, displayedUserName);

      collection.set([
        {
          range: new monacoNs.Range(lineNumber, column, lineNumber, column + 1),
          options: {
            className: `remote-cursor-${clientId}`,
          },
        },
      ]);
    }

    // GC for removed clients
    for (const [clientId, collection] of collections.entries()) {
      if (!states.has(clientId)) {
        collection.clear();
        collections.delete(clientId);
      }
    }
  };

  const updatePresenterState = (states: Map<number, AwarenessState>) => {
    const presenter = [...states.entries()].find(
      ([, state]) => state.user?.role === 'presenter',
    );

    const presenterId = presenter?.[0] ?? null;
    const amIPresenter = presenterId === awareness.clientID;

    setHasPresenter(Boolean(presenterId));
    setIsPresenter(amIPresenter);

    editor.updateOptions({
      readOnly: presenterId !== null && !amIPresenter,
    });
  };

  // Awareness -> Socket
  const onAwarenessUpdate = () => {
    const update = awarenessProtocolRuntime.encodeAwarenessUpdate(awareness, [
      ydoc.clientID,
    ]);
    socket.emit('awareness-update', update);
  };

  // Socket -> Awareness
  const onAwarenessSocketUpdate = (update: ArrayBuffer) => {
    awarenessProtocolRuntime.applyAwarenessUpdate(
      awareness,
      new Uint8Array(update),
      socket,
    );
  };

  const onAwarenessChange = () => {
    const states = awareness.getStates() as Map<number, AwarenessState>;
    updateRemoteDecorations(states);
    updatePresenterState(states);
  };

  awareness.on('update', onAwarenessUpdate);
  awareness.on('change', onAwarenessChange);
  socket.on('awareness-update', onAwarenessSocketUpdate);

  // cursor position -> awareness
  let cursorFrame: number | null = null;
  const cursorDisposable = editor.onDidChangeCursorPosition((e) => {
    if (cursorFrame) return;

    cursorFrame = requestAnimationFrame(() => {
      awareness.setLocalStateField('cursor', {
        lineNumber: e.position.lineNumber,
        column: e.position.column,
      });
      cursorFrame = null;
    });
  });

  return () => {
    awareness.off('update', onAwarenessUpdate);
    awareness.off('change', onAwarenessChange);
    socket.off('awareness-update', onAwarenessSocketUpdate);
    cursorDisposable.dispose();

    if (cursorFrame) {
      cancelAnimationFrame(cursorFrame);
    }
  };
};
