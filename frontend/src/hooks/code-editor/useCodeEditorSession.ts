import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import * as monaco from 'monaco-editor';
import * as Y from 'yjs';
import * as awarenessProtocol from 'y-protocols/awareness';
import * as Sentry from '@sentry/nextjs';

import { EditorLanguage } from '@/constants/code-editor';
import {
  LanguageState,
  MonacoNamespace,
  SyncState,
  UseCodeEditorSessionParams,
  YjsProviderRef,
} from '@/types/code-editor';
import { syncLog } from '@/utils/logging';
import { setupAwarenessBridge } from './session/awarenessBridge';
import { setupUndoRedoShortcuts } from './session/editorShortcuts';
import { setupLanguageObserver } from './session/languageBridge';
import { createInitialSyncState } from './session/syncState';
import { setupSyncBridge } from './session/syncBridge';

const clearEditorArtifacts = (
  cursorCollectionsRef: RefObject<
    Map<number, monaco.editor.IEditorDecorationsCollection>
  >,
) => {
  cursorCollectionsRef.current.forEach((collection) => collection.clear());
  cursorCollectionsRef.current.clear();
  document
    .querySelectorAll('style[data-client-id]')
    .forEach((element) => element.remove());
};

export const useCodeEditorSession = ({
  autoComplete,
  minimap,
  onlyMyCursor,
  nickname,
  socket,
}: UseCodeEditorSessionParams) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<MonacoNamespace | null>(null);
  const providerRef = useRef<YjsProviderRef | null>(null);

  const cursorCollectionsRef = useRef<
    Map<number, monaco.editor.IEditorDecorationsCollection>
  >(new Map());
  const onlyMyCursorRef = useRef(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  const pendingUpdatesRef = useRef<Uint8Array[]>([]);
  const mergeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const syncStateRef = useRef<SyncState>(createInitialSyncState());

  const [isPresenter, setIsPresenter] = useState(false);
  const [hasPresenter, setHasPresenter] = useState(false);
  const [codeLanguage, setCodeLanguage] =
    useState<EditorLanguage>('typescript');

  // editor 마운트 메인 로직
  const handleMount = useCallback(
    async (
      editor: monaco.editor.IStandaloneCodeEditor,
      monacoNs: MonacoNamespace,
    ) => {
      cleanupRef.current?.();

      editorRef.current = editor;
      monacoRef.current = monacoNs;
      syncStateRef.current = createInitialSyncState();

      // Yjs 객체 초기화
      const ydoc = new Y.Doc();
      const yText = ydoc.getText('monaco');
      const awareness = new awarenessProtocol.Awareness(ydoc);
      providerRef.current = { ydoc, awareness };

      const model = editor.getModel();
      if (!model) {
        ydoc.destroy();
        return;
      }

      model.pushStackElement();

      const remoteOrigin = Symbol('remote');
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

      setupUndoRedoShortcuts(editor, monacoNs, undoManager);

      if (!socket) {
        cleanupRef.current = () => {
          undoManager.destroy();
          binding.destroy();
          ydoc.destroy();
          clearEditorArtifacts(cursorCollectionsRef);
        };
        return;
      }

      Sentry.setUser({ username: nickname });
      Sentry.setTags({
        feature: 'code-editor',
        initial_language: codeLanguage,
      });
      Sentry.setContext('editor_config', {
        autoComplete,
        minimap,
        clientId: ydoc.clientID,
      });

      syncLog('editor.mounted', {
        language: codeLanguage,
        clientId: ydoc.clientID,
      });

      const teardownSync = setupSyncBridge({
        socket,
        ydoc,
        yText,
        syncStateRef,
        pendingUpdatesRef,
        mergeTimerRef,
        remoteOrigin,
      });

      const teardownAwareness = setupAwarenessBridge({
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
      });

      const teardownLanguageObserver = setupLanguageObserver(
        ydoc,
        model,
        monacoNs,
        setCodeLanguage,
      );

      cleanupRef.current = () => {
        syncStateRef.current.readySent = false;
        teardownLanguageObserver();
        teardownAwareness();
        teardownSync();
        undoManager.destroy();
        binding.destroy();
        socket.disconnect();
        ydoc.destroy();
        clearEditorArtifacts(cursorCollectionsRef);
      };
    },
    [autoComplete, codeLanguage, minimap, nickname, socket],
  );

  useEffect(() => {
    onlyMyCursorRef.current = onlyMyCursor;
    cursorCollectionsRef.current.forEach((collection) => collection.clear());
  }, [onlyMyCursor]);

  useEffect(() => {
    return () => cleanupRef.current?.();
  }, []);

  const becomePresenter = useCallback(() => {
    if (hasPresenter) return;
    if (!providerRef.current) return;

    const prevUser = providerRef.current.awareness.getLocalState()?.user;
    providerRef.current.awareness.setLocalStateField('user', {
      ...prevUser,
      role: 'presenter',
    });
  }, [hasPresenter]);

  const cancelPresenter = useCallback(() => {
    if (!providerRef.current) return;

    const prevUser = providerRef.current.awareness.getLocalState()?.user;
    providerRef.current.awareness.setLocalStateField('user', {
      ...prevUser,
      role: 'viewer',
    });
  }, []);

  const changeLanguage = useCallback((lang: EditorLanguage) => {
    const editor = editorRef.current;
    const monacoNs = monacoRef.current;
    const model = editor?.getModel();
    const provider = providerRef.current;

    if (!editor || !monacoNs || !model || !provider) return;
    if (model.getLanguageId() === lang) return;

    monacoNs.editor.setModelLanguage(model, lang);
    setCodeLanguage(lang);

    const yLanguage = provider.ydoc.getMap<LanguageState>('language');
    yLanguage.set('current', {
      value: lang,
      updatedAt: Date.now(),
      updatedBy: provider.awareness.clientID,
    });
  }, []);

  return {
    handleMount,
    isPresenter,
    hasPresenter,
    codeLanguage,
    becomePresenter,
    cancelPresenter,
    changeLanguage,
  };
};
