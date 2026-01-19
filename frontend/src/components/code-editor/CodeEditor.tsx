'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import * as Y from 'yjs';
import * as awarenessProtocol from 'y-protocols/awareness';
import { io, Socket } from 'socket.io-client';

import { colorFromClientId, injectCursorStyles } from '@/utils/code-editor';
import { AwarenessState, LanguageState } from '@/types/code-editor';
import CodeEditorToolbar from './CodeEditorToolbar';
import { EditorLanguage } from '@/constants/code-editor';

type CodeEditorProps = {
  autoComplete?: boolean;
  minimap?: boolean;
};

// TODO: 모듈로 빼서 가져오기
const SERVER_URL = process.env.NEXT_PUBLIC_TOOL_BACKEND_URL;
const NAMESPACE = process.env.NEXT_PUBLIC_TOOL_BACKEND_WEBSOCKET_PREFIX;
const SOCKET_PATH = process.env.NEXT_PUBLIC_TOOL_BACKEND_WEBSOCKET_CODEEDITOR;

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
  >(new Map()); // clientId -> 1 decoration collection
  const onlyMyCursorRef = useRef(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  const [isAutoCompleted, setIsAutoCompleted] = useState<boolean>(autoComplete);
  const [isPresenter, setIsPresenter] = useState<boolean>(false);
  const [hasPresenter, setHasPresenter] = useState<boolean>(false);
  const [codeLanguage, setCodeLanguage] =
    useState<EditorLanguage>('typescript');
  const [onlyMyCursor, setOnlyMyCursor] = useState<boolean>(false);

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

    providerRef.current = { ydoc, awareness };

    const socket = io(`${SERVER_URL}${NAMESPACE}`, {
      path: SOCKET_PATH,
      transports: ['websocket'],
      auth: { token: 'test-token' }, // TODO: 실제 토큰으로 교체
    });

    socketRef.current = socket;

    socket.on('init-user', ({ userId }: { userId: string }) => {
      awareness.setLocalState({
        user: {
          name: userId,
          role: 'viewer',
          color: colorFromClientId(ydoc.clientID).cursor,
        },
        cursor: null,
      });
    });

    // Yjs -> Socket
    ydoc.on('update', (update: Uint8Array) => {
      socket.emit('yjs-update', update);
    });

    // Awareness -> Socket
    awareness.on('update', () => {
      const update = awarenessProtocol.encodeAwarenessUpdate(awareness, [
        ydoc.clientID,
      ]);
      socket.emit('awareness-update', update);
    });

    // Socket -> Yjs
    socket.on('yjs-update', (update: ArrayBuffer) => {
      Y.applyUpdate(ydoc, new Uint8Array(update));
    });

    // Socket -> Awareness
    socket.on('awareness-update', (update: ArrayBuffer) => {
      awarenessProtocol.applyAwarenessUpdate(
        awareness,
        new Uint8Array(update),
        socket,
      );
    });

    // 초기 동기화 로직 (새 유저 진입 시)
    socket.on('request-sync', () => {
      const fullUpdate = Y.encodeStateAsUpdate(ydoc);
      socket.emit('yjs-update', fullUpdate);
    });

    const model = editor.getModel();
    if (!model) return;

    const { MonacoBinding } = await import('y-monaco');
    // 양방향 바인딩 해주기
    const binding = new MonacoBinding(
      yText, // 원본 데이터
      model, // 실제 에디터에 보이는 코드
      new Set([editor]), // 바인딩할 에디터 인스턴스들
      awareness, // 여기서 다른 유저들의 위치 정보를 받아온다.
    );

    // 커서 렌더링만 담당
    const updateRemoteDecorations = (states: Map<number, AwarenessState>) => {
      if (!editorRef.current) return;

      const onlyMine = onlyMyCursorRef.current;
      const collections = cursorCollectionsRef.current;
      const myId = awareness.clientID;

      states.forEach((state, clientId) => {
        if (clientId === myId) return;

        // 본인 제외 클라이언트들 collection 지우기
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

        // 사라진 client 정리 => GC용
        for (const [clientId, collection] of collections) {
          if (!states.has(clientId)) {
            collection.clear();
            collections.delete(clientId);
          }
        }
      });
    };

    const updatePresenterState = (states: Map<number, AwarenessState>) => {
      // 발표자 찾기
      const presenter = [...states.entries()].find(
        ([_, state]) => state.user?.role === 'presenter',
      );

      const presenterId = presenter?.[0] ?? null;

      const amIPresenter =
        presenterId === providerRef.current?.awareness.clientID;

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

    // 커서 위치 전송
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

    yLanguage.observe(() => {
      const lang = yLanguage.get('current');
      if (!lang) return;

      if (model.getLanguageId() !== lang.value) {
        monaco.editor.setModelLanguage(model, lang.value);
        setCodeLanguage(lang.value);
      }
    });

    cleanupRef.current = () => {
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

  // react <-> monaco <-> awareness 사이 동기화 브릿지 로직
  useEffect(() => {
    onlyMyCursorRef.current = onlyMyCursor;

    if (editorRef.current) {
      cursorCollectionsRef.current.forEach((c) => c.clear());
    }
  }, [onlyMyCursor]);

  // 자동완성 토글
  const toggleAutoComplete = useCallback(() => {
    setIsAutoCompleted((prev) => !prev);
  }, []);

  const toggleOnlyMyCursor = useCallback(() => {
    setOnlyMyCursor((prev) => !prev);
  }, []);

  // 발표자 되기
  const becomePresenter = () => {
    if (hasPresenter) return;
    if (!providerRef.current) return;

    const prevUser = providerRef.current.awareness.getLocalState()?.user;
    providerRef.current.awareness.setLocalStateField('user', {
      ...prevUser,
      role: 'presenter',
    });
  };

  // 발표자 취소
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

    // 로컬 반영
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

      {/* 코드에디터 */}
      <Editor
        width="100%"
        height="100%"
        theme="vs-dark"
        defaultLanguage={codeLanguage}
        onMount={handleMount}
        options={{
          automaticLayout: true,

          // 편집
          tabSize: 2, // 탭 크기 설정
          insertSpaces: true, // 탭 입력 시 공백으로 처리
          fontSize: 14,

          // UX
          lineNumbers: 'on', // 줄번호 표시
          wordWrap: 'off', // 자동 줄바꿈 비활성화
          minimap: { enabled: minimap }, // 미니맵 활성화 여부

          // 자동완성
          quickSuggestions: isAutoCompleted,
          suggestOnTriggerCharacters: isAutoCompleted,
          acceptSuggestionOnEnter: isAutoCompleted ? 'on' : 'off', // 엔터키 자동완성
          tabCompletion: isAutoCompleted ? 'on' : 'off', // 탭키 자동완성

          // 문서 안에 있는 “단어들”을 자동완성 후보로 쓸지에 대한 설정
          wordBasedSuggestions: 'off', // 협업 중엔 끄는 게 깔끔해서 off로 설정

          // 기타
          cursorStyle: 'line',
          scrollBeyondLastLine: false,
          mouseWheelZoom: true, // ctrl + 마우스 휠로 폰트 크기 확대/축소
        }}
      />
    </div>
  );
}
