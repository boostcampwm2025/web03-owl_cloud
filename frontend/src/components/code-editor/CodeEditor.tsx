'use client';

import Editor from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { colorFromClientId, injectCursorStyles } from '@/utils/code-editor';
import { AwarenessState } from '@/types/code-editor';

type CodeEditorProps = {
  language?: string;
  autoComplete?: boolean;
  minimap?: boolean;
};

export default function CodeEditor({
  language = 'typescript',
  autoComplete = true,
  minimap = true,
}: CodeEditorProps) {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const remoteDecorationsRef =
    useRef<monaco.editor.IEditorDecorationsCollection | null>(null);

  const [isAutoCompleted, setIsAutoCompleted] = useState<boolean>(autoComplete);
  const [isPresenter, setIsPresenter] = useState<boolean>(false);
  const [hasPresenter, setHasPresenter] = useState<boolean>(false);

  const handleMount = async (
    editor: monaco.editor.IStandaloneCodeEditor,
    monaco: typeof import('monaco-editor'),
  ) => {
    editorRef.current = editor;

    if (!remoteDecorationsRef.current) {
      remoteDecorationsRef.current = editor.createDecorationsCollection();
    }

    const ydoc = new Y.Doc();
    const { MonacoBinding } = await import('y-monaco');

    const provider = new WebsocketProvider(
      'ws://localhost:1234',
      'room-1',
      ydoc,
    );
    providerRef.current = provider;

    // 사용자 정보 동적 설정
    const userName = `User-${Math.floor(Math.random() * 100)}`;

    provider.awareness.setLocalState({
      user: {
        name: userName,
        role: 'viewer',
      },
      cursor: null,
    });

    const yText = ydoc.getText('monaco');

    const model = editor.getModel();
    if (!model) return;

    // 양방향 바인딩 해주기
    const binding = new MonacoBinding(
      yText, // 원본 데이터
      model, // 실제 에디터에 보이는 코드
      new Set([editor]), // 바인딩할 에디터 인스턴스들
      provider.awareness, // 여기서 다른 유저들의 위치 정보를 받아온다.
    );

    // 커서 위치 전송
    let cursorFrame: number | null = null;

    editor.onDidChangeCursorPosition((e) => {
      if (cursorFrame) return;

      cursorFrame = requestAnimationFrame(() => {
        provider.awareness.setLocalStateField('cursor', {
          lineNumber: e.position.lineNumber,
          column: e.position.column,
        });
        cursorFrame = null;
      });
    });

    // 커서 렌더링만 담당
    const updateRemoteDecorations = (states: Map<number, AwarenessState>) => {
      if (!editorRef.current) return;

      const decorations: monaco.editor.IModelDeltaDecoration[] = [];

      states.forEach((state, clientId) => {
        if (clientId === provider.awareness.clientID) return;
        if (!state.cursor) return;

        const { lineNumber, column } = state.cursor;

        const { cursor } = colorFromClientId(clientId);
        injectCursorStyles(clientId, cursor);

        decorations.push({
          range: new monaco.Range(lineNumber, column, lineNumber, column + 1),
          options: {
            className: `remote-cursor-${clientId}`,
            stickiness:
              monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
          },
        });
      });

      remoteDecorationsRef.current!.set(decorations);
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

    provider.awareness.on('change', () => {
      const states = provider.awareness.getStates();

      updateRemoteDecorations(states);
      updatePresenterState(states);
    });

    cleanupRef.current = () => {
      binding.destroy();
      provider.destroy();
      ydoc.destroy();

      remoteDecorationsRef.current?.clear();
      remoteDecorationsRef.current = null;

      document
        .querySelectorAll('style[data-client-id]')
        .forEach((el) => el.remove());
    };
  };

  useEffect(() => {
    return () => cleanupRef.current?.();
  }, []);

  // 자동완성 토글
  const toggleAutoComplete = () => setIsAutoCompleted((prev) => !prev);

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

  const disabledPresenter = hasPresenter && !isPresenter;

  return (
    <div className="flex h-full w-full flex-col">
      {/* 상단 컨트롤 */}
      <div className="flex items-center gap-2 border-b border-neutral-700 p-2">
        <button
          onClick={toggleAutoComplete}
          className={`rounded px-3 py-1 text-sm font-bold text-white transition-colors ${
            isAutoCompleted
              ? 'bg-green-600 hover:bg-green-500'
              : 'bg-red-600 hover:bg-red-500'
          }`}
        >
          자동완성 {isAutoCompleted ? 'ON' : 'OFF'}
        </button>

        {!isPresenter && (
          <button
            onClick={becomePresenter}
            disabled={disabledPresenter}
            className={`rounded px-3 py-1 text-sm ${disabledPresenter ? 'bg-neutral-100 text-neutral-400' : 'bg-blue-600 text-white'}`}
          >
            스포트라이트
          </button>
        )}

        {isPresenter && (
          <button
            onClick={cancelPresenter}
            className="rounded bg-red-600 px-3 py-1 text-sm text-white"
          >
            스포트라이트 해제
          </button>
        )}

        {hasPresenter && (
          <span className="text-sm text-neutral-400">
            {isPresenter ? '편집 가능 (발표자)' : '읽기 전용 (참가자)'}
          </span>
        )}
      </div>

      {/* 코드에디터 */}
      <Editor
        width="100%"
        height="100%"
        theme="vs-dark"
        defaultLanguage={language}
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
