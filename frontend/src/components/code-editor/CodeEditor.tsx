'use client';

import Editor from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { useCallback, useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { colorFromClientId, injectCursorStyles } from '@/utils/code-editor';
import { AwarenessState, LanguageState } from '@/types/code-editor';
import CodeEditorToolbar from './CodeEditorToolbar';
import { EditorLanguage } from '@/constants/code-editor';

type CodeEditorProps = {
  autoComplete?: boolean;
  minimap?: boolean;
};

export default function CodeEditor({
  autoComplete = true,
  minimap = true,
}: CodeEditorProps) {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const monacoRef = useRef<typeof import('monaco-editor') | null>(null);

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

  useEffect(() => {
    onlyMyCursorRef.current = onlyMyCursor;
  }, [onlyMyCursor]);

  const handleMount = async (
    editor: monaco.editor.IStandaloneCodeEditor,
    monaco: typeof import('monaco-editor'),
  ) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    const ydoc = new Y.Doc();
    const yLanguage = ydoc.getMap<LanguageState>('language');
    const { MonacoBinding } = await import('y-monaco');

    const provider = new WebsocketProvider(
      'ws://localhost:1234',
      'room-1',
      ydoc,
    );
    providerRef.current = provider;

    // 사용자 정보 동적 설정 > TODO: 실제 사용자 닉네임 가져오기
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

      const onlyMine = onlyMyCursorRef.current;
      const collections = cursorCollectionsRef.current;
      const myId = provider.awareness.clientID;

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

    provider.awareness.on('change', () => {
      const states = provider.awareness.getStates();

      updateRemoteDecorations(states);
      updatePresenterState(states);
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
      provider.destroy();
      ydoc.destroy();

      cursorCollectionsRef.current.forEach((c) => c.clear());
      cursorCollectionsRef.current.clear();

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

    if (providerRef.current) {
      if (!editorRef.current) return;

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

    const yLanguage = provider.doc.getMap<LanguageState>('language');

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
