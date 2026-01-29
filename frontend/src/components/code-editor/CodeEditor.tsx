'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import * as Y from 'yjs';
import * as awarenessProtocol from 'y-protocols/awareness';
import { Socket } from 'socket.io-client';

import { colorFromClientId, injectCursorStyles } from '@/utils/code-editor';
import { AwarenessState, LanguageState } from '@/types/code-editor';
import CodeEditorToolbar from './CodeEditorToolbar';
import { EditorLanguage } from '@/constants/code-editor';
import { useToolSocketStore } from '@/store/useToolSocketStore';
import { useUserStore } from '@/store/useUserStore';

type CodeEditorProps = {
  autoComplete?: boolean;
  minimap?: boolean;
};

/**
 * ---- wire types (server <-> client) ----
 * 서버 코드 기준:
 * - server -> client: 'yjs-init' { update: Buffer, seq: number, origin: 'INIT' }
 * - server -> client: 'yjs-sync' ack|patch|full|error (+ origin)
 * - server -> client: 'yjs-update' 단일/배치 브로드캐스트
 * - client -> server: 'yjs-update' { last_seq, update? | updates? }
 * - client -> server: 'yjs-sync-req' { last_seq, reason? }
 * - client -> server: 'yjs-ready' (리스너 준비 완료 후 init 요청)
 */

type YjsInitPayload = {
  update: ArrayBuffer;
  seq: number;
  origin?: 'INIT';
};

type YjsRemoteUpdateSingle = { seq: number; update: ArrayBuffer };
type YjsRemoteUpdateBatch = {
  from_seq: number;
  to_seq: number;
  updates: ArrayBuffer[];
};
type YjsRemoteUpdate = YjsRemoteUpdateSingle | YjsRemoteUpdateBatch;

type YjsSyncOrigin = 'UPDATE_REJECTED' | 'SYNC_REQ' | 'INIT';

type YjsSyncServerPayload =
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

type YjsSyncReqPayload = {
  last_seq: number;
  reason?: 'SEQ_GAP' | 'MANUAL' | 'UNKNOWN' | 'INIT';
};

type YjsUpdateClientPayload = {
  last_seq: number;
  update?: Uint8Array;
  updates?: Uint8Array[];
};

export default function CodeEditor({
  autoComplete = true,
  minimap = true,
}: CodeEditorProps) {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof import('monaco-editor') | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const providerRef = useRef<{
    ydoc: Y.Doc;
    awareness: awarenessProtocol.Awareness;
  } | null>(null);

  const cursorCollectionsRef = useRef<
    Map<number, monaco.editor.IEditorDecorationsCollection>
  >(new Map());
  const onlyMyCursorRef = useRef(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  const [isAutoCompleted, setIsAutoCompleted] = useState<boolean>(autoComplete);
  const [isPresenter, setIsPresenter] = useState<boolean>(false);
  const [hasPresenter, setHasPresenter] = useState<boolean>(false);
  const [codeLanguage, setCodeLanguage] =
    useState<EditorLanguage>('typescript');
  const [onlyMyCursor, setOnlyMyCursor] = useState<boolean>(false);

  const { codeEditorSocket: socket } = useToolSocketStore();
  const { nickname } = useUserStore();

  /**
   * ---- sync control refs ----
   */
  const lastSeqRef = useRef<number>(0); // 내가 "적용 완료"한 서버 seq
  const awaitingAckRef = useRef<boolean>(false); // 서버 ack 대기 중
  const suppressSendRef = useRef<boolean>(false); // sync/remote apply 중 ydoc update 재전송 방지
  const dirtyRef = useRef<boolean>(false); // ack 대기 중 변경이 더 생겼는지
  const syncReqInFlightRef = useRef<boolean>(false); // sync-req 폭주 방지

  // ✅ yjs-ready 중복 방지
  const readySentRef = useRef<boolean>(false);

  const handleMount = async (
    editor: monaco.editor.IStandaloneCodeEditor,
    monaco: typeof import('monaco-editor'),
  ) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    const ydoc = new Y.Doc();
    const yLanguage = ydoc.getMap<LanguageState>('language');
    const yText = ydoc.getText('monaco');
    const awareness = new awarenessProtocol.Awareness(ydoc);

    const remoteOrigin = Symbol('remote');

    editor.getModel()?.pushStackElement();

    const model = editor.getModel();
    if (!model) return;

    const { MonacoBinding } = await import('y-monaco');
    const binding = new MonacoBinding(
      yText,
      model,
      new Set([editor]),
      awareness,
    );

    const undoManager = new Y.UndoManager(yText, {
      trackedOrigins: new Set([binding]),
      captureTimeout: 500,
    });

    providerRef.current = { ydoc, awareness };

    socketRef.current = socket;
    if (!socket) return;

    /**
     * ---- helpers ----
     */
    const applyUpdatesNoSend = (updates: ArrayBuffer[]) => {
      suppressSendRef.current = true;
      try {
        ydoc.transact(() => {
          for (const u of updates) {
            Y.applyUpdate(ydoc, new Uint8Array(u));
          }
        }, remoteOrigin);
      } finally {
        suppressSendRef.current = false;
      }
    };

    const requestSync = (reason: YjsSyncReqPayload['reason'] = 'SEQ_GAP') => {
      if (syncReqInFlightRef.current) return;
      syncReqInFlightRef.current = true;

      socket.emit('yjs-sync-req', {
        last_seq: lastSeqRef.current,
        reason,
      } satisfies YjsSyncReqPayload);

      // 타임아웃으로 inFlight 해제(서버/네트워크 이슈 대비)
      setTimeout(() => {
        syncReqInFlightRef.current = false;
      }, 1500);
    };

    const sendFullStateOnce = () => {
      if (!providerRef.current) return;

      // ack 기다리는 중이면 큐 쌓지 말고 dirty만 표시
      if (awaitingAckRef.current) {
        dirtyRef.current = true;
        return;
      }

      const full = Y.encodeStateAsUpdate(providerRef.current.ydoc);
      awaitingAckRef.current = true;
      dirtyRef.current = false;

      const payload: YjsUpdateClientPayload = {
        last_seq: lastSeqRef.current,
        update: full,
      };
      socket.emit('yjs-update', payload);
    };

    /**
     * ---- awareness: local init ----
     */
    awareness.setLocalState({
      user: {
        name: nickname || '알 수 없음',
        role: 'viewer',
        color: colorFromClientId(ydoc.clientID).cursor,
      },
      cursor: null,
    });

    // Awareness -> Socket
    awareness.on('update', () => {
      const update = awarenessProtocol.encodeAwarenessUpdate(awareness, [
        ydoc.clientID,
      ]);
      socket.emit('awareness-update', update);
    });

    // Socket -> Awareness
    const onAwarenessUpdate = (update: ArrayBuffer) => {
      awarenessProtocol.applyAwarenessUpdate(
        awareness,
        new Uint8Array(update),
        socket,
      );
    };
    socket.on('awareness-update', onAwarenessUpdate);

    /**
     * ---- Socket -> Yjs (init) ----
     */
    const onYjsInit = (data: YjsInitPayload) => {
      applyUpdatesNoSend([data.update]);
      lastSeqRef.current = data.seq;

      awaitingAckRef.current = false;
      dirtyRef.current = false;
      syncReqInFlightRef.current = false;

      console.log(data);
    };
    socket.on('yjs-init', onYjsInit);

    /**
     * ---- Socket -> Yjs (sync) ----
     */
    const onYjsSync = (msg: YjsSyncServerPayload) => {
      if (!msg.ok) {
        awaitingAckRef.current = false;
        syncReqInFlightRef.current = false;
        return;
      }

      if (msg.type === 'ack') {
        lastSeqRef.current = Math.max(lastSeqRef.current, msg.server_seq);
        awaitingAckRef.current = false;
        syncReqInFlightRef.current = false;

        // ack 기다리는 동안 더 입력이 있었다면 full-state 한 방
        if (dirtyRef.current) {
          sendFullStateOnce();
        }
        return;
      }

      if (msg.type === 'full') {
        applyUpdatesNoSend([msg.update]);
        lastSeqRef.current = Math.max(lastSeqRef.current, msg.server_seq);

        awaitingAckRef.current = false;
        syncReqInFlightRef.current = false;

        // ✅ UPDATE_REJECTED인 경우만 재전송(A안)
        if (msg.origin === 'UPDATE_REJECTED') {
          sendFullStateOnce();
        }
        return;
      }

      if (msg.type === 'patch') {
        applyUpdatesNoSend(msg.updates);
        lastSeqRef.current = Math.max(lastSeqRef.current, msg.to_seq);

        awaitingAckRef.current = false;
        syncReqInFlightRef.current = false;

        // ✅ UPDATE_REJECTED인 경우만 재전송(A안)
        if (msg.origin === 'UPDATE_REJECTED') {
          sendFullStateOnce();
        }
        return;
      }
    };
    socket.on('yjs-sync', onYjsSync);

    /**
     * ---- Socket -> Yjs (remote updates) ----
     * 단일/배치 모두 커버 + seq gap이면 sync-req
     */
    const onYjsRemoteUpdate = (msg: YjsRemoteUpdate) => {
      // 단일
      if ('seq' in msg) {
        const expected = lastSeqRef.current + 1;
        if (msg.seq !== expected) {
          requestSync('SEQ_GAP');
          return;
        }

        applyUpdatesNoSend([msg.update]);
        lastSeqRef.current = msg.seq;
        syncReqInFlightRef.current = false;
        return;
      }

      // 배치
      const expectedFrom = lastSeqRef.current + 1;
      if (msg.from_seq !== expectedFrom) {
        requestSync('SEQ_GAP');
        return;
      }

      applyUpdatesNoSend(msg.updates);
      lastSeqRef.current = msg.to_seq;
      syncReqInFlightRef.current = false;
    };
    socket.on('yjs-update', onYjsRemoteUpdate);

    /**
     * ---- ✅ Ready handshake ----
     * 모든 리스너 등록이 끝난 뒤에 서버에 init 요청
     */
    if (!readySentRef.current) {
      readySentRef.current = true;
      socket.emit('yjs-ready');
    }

    /**
     * ---- Yjs -> Socket (local updates) ----
     * ack 기반 backpressure + A안
     */
    const onYdocUpdate = (update: Uint8Array, origin: unknown) => {
      if (origin === remoteOrigin) return;
      if (suppressSendRef.current) return;

      dirtyRef.current = true;

      // ack 기다리는 중이면 쌓지 않고 표시만
      if (awaitingAckRef.current) return;

      awaitingAckRef.current = true;
      dirtyRef.current = false;

      const payload: YjsUpdateClientPayload = {
        last_seq: lastSeqRef.current,
        update,
      };
      socket.emit('yjs-update', payload);
    };
    ydoc.on('update', onYdocUpdate);

    /**
     * ---- monaco shortcuts ----
     */
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyZ, () => {
      undoManager.undo();
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyY, () => {
      undoManager.redo();
    });

    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyZ,
      () => {
        undoManager.redo();
      },
    );

    /**
     * ---- cursor rendering only (기존 로직 유지) ----
     */
    const updateRemoteDecorations = (states: Map<number, AwarenessState>) => {
      if (!editorRef.current) return;

      const onlyMine = onlyMyCursorRef.current;
      const collections = cursorCollectionsRef.current;
      const myId = awareness.clientID;

      states.forEach((state, clientId) => {
        if (clientId === myId) return;

        if (!state.cursor || onlyMine) {
          collections.get(clientId)?.clear();
          return;
        }

        const { lineNumber, column } = state.cursor;

        if (!collections.has(clientId)) {
          collections.set(clientId, editor.createDecorationsCollection());
        }

        const collection = collections.get(clientId)!;

        const { cursor } = colorFromClientId(clientId);
        const displayedUserName = state.user?.name ?? 'User';

        injectCursorStyles(clientId, cursor, displayedUserName);

        collection.set([
          {
            range: new monaco.Range(lineNumber, column, lineNumber, column + 1),
            options: {
              className: `remote-cursor-${clientId}`,
              stickiness:
                monaco.editor.TrackedRangeStickiness
                  .NeverGrowsWhenTypingAtEdges,
            },
          },
        ]);

        // GC for removed clients
        for (const [cid, col] of collections) {
          if (!states.has(cid)) {
            col.clear();
            collections.delete(cid);
          }
        }
      });
    };

    const updatePresenterState = (states: Map<number, AwarenessState>) => {
      const presenter = [...states.entries()].find(
        ([_, state]) => state.user?.role === 'presenter',
      );

      const presenterId = presenter?.[0] ?? null;
      const amIPresenter = presenterId === awareness.clientID;

      setHasPresenter(Boolean(presenterId));
      setIsPresenter(amIPresenter);

      editorRef.current?.updateOptions({
        readOnly: presenterId !== null && !amIPresenter,
      });
    };

    awareness.on('change', () => {
      const states = awareness.getStates();
      updateRemoteDecorations(states);
      updatePresenterState(states);
    });

    // cursor position -> awareness
    let cursorFrame: number | null = null;
    editor.onDidChangeCursorPosition((e) => {
      if (cursorFrame) return;
      cursorFrame = requestAnimationFrame(() => {
        awareness.setLocalStateField('cursor', {
          lineNumber: e.position.lineNumber,
          column: e.position.column,
        });
        cursorFrame = null;
      });
    });

    /**
     * ---- language observe (기존 유지) ----
     */
    yLanguage.observe(() => {
      const lang = yLanguage.get('current');
      if (!lang) return;

      if (model.getLanguageId() !== lang.value) {
        monaco.editor.setModelLanguage(model, lang.value);
        setCodeLanguage(lang.value);
      }
    });

    /**
     * ---- cleanup ----
     */
    cleanupRef.current = () => {
      // ✅ ready flag reset (선택이지만 깔끔)
      readySentRef.current = false;

      // socket handler 제거
      socket.off('awareness-update', onAwarenessUpdate);
      socket.off('yjs-init', onYjsInit);
      socket.off('yjs-sync', onYjsSync);
      socket.off('yjs-update', onYjsRemoteUpdate);

      ydoc.off('update', onYdocUpdate);

      undoManager.destroy();
      binding.destroy();
      socket.disconnect();
      ydoc.destroy();

      cursorCollectionsRef.current.forEach((c) => c.clear());
      document
        .querySelectorAll('style[data-client-id]')
        .forEach((el) => el.remove());
    };
  };

  useEffect(() => {
    return () => cleanupRef.current?.();
  }, []);

  useEffect(() => {
    onlyMyCursorRef.current = onlyMyCursor;
    if (editorRef.current) {
      cursorCollectionsRef.current.forEach((c) => c.clear());
    }
  }, [onlyMyCursor]);

  const toggleAutoComplete = useCallback(() => {
    setIsAutoCompleted((prev) => !prev);
  }, []);

  const toggleOnlyMyCursor = useCallback(() => {
    setOnlyMyCursor((prev) => !prev);
  }, []);

  const becomePresenter = () => {
    if (hasPresenter) return;
    if (!providerRef.current) return;

    const prevUser = providerRef.current.awareness.getLocalState()?.user;
    providerRef.current.awareness.setLocalStateField('user', {
      ...prevUser,
      role: 'presenter',
    });
  };

  const cancelPresenter = () => {
    if (!providerRef.current) return;

    const prevUser = providerRef.current.awareness.getLocalState()?.user;
    providerRef.current.awareness.setLocalStateField('user', {
      ...prevUser,
      role: 'viewer',
    });
  };

  const changeLanguage = useCallback((lang: EditorLanguage) => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    const model = editor?.getModel();
    const provider = providerRef.current;

    if (!editor || !monaco || !model || !provider) return;
    if (model.getLanguageId() === lang) return;

    monaco.editor.setModelLanguage(model, lang);
    setCodeLanguage(lang);

    const yLanguage = provider.ydoc.getMap<LanguageState>('language');
    yLanguage.set('current', {
      value: lang,
      updatedAt: Date.now(),
      updatedBy: provider.awareness.clientID,
    });
  }, []);

  return (
    <div className="flex h-full w-full flex-col">
      <CodeEditorToolbar
        isAutoCompleted={isAutoCompleted}
        isPresenter={isPresenter}
        hasPresenter={hasPresenter}
        onToggleAutoComplete={toggleAutoComplete}
        onBecomePresenter={becomePresenter}
        onCancelPresenter={cancelPresenter}
        language={codeLanguage}
        onLanguageChange={changeLanguage}
        isOnlyMycursor={onlyMyCursor}
        onToggleOnlyMyCursor={toggleOnlyMyCursor}
      />

      <Editor
        width="100%"
        height="100%"
        theme="vs-dark"
        defaultLanguage={codeLanguage}
        onMount={handleMount}
        options={{
          automaticLayout: true,

          // 편집
          tabSize: 2,
          insertSpaces: true,
          fontSize: 14,

          // UX
          lineNumbers: 'on',
          wordWrap: 'off',
          minimap: { enabled: minimap },

          // 자동완성
          quickSuggestions: isAutoCompleted,
          suggestOnTriggerCharacters: isAutoCompleted,
          acceptSuggestionOnEnter: isAutoCompleted ? 'on' : 'off',
          tabCompletion: isAutoCompleted ? 'on' : 'off',

          // 협업 중엔 끄는 게 깔끔
          wordBasedSuggestions: 'off',

          // 기타
          cursorStyle: 'line',
          scrollBeyondLastLine: false,
          mouseWheelZoom: true,
        }}
      />
    </div>
  );
}
