import { useCallback, useState } from 'react';
import Editor from '@monaco-editor/react';

import CodeEditorToolbar from './CodeEditorToolbar';
import { useCodeEditorSession } from '../../hooks/code-editor/useCodeEditorSession';
import { useToolSocketStore } from '@/store/useToolSocketStore';
import { useUserStore } from '@/store/useUserStore';

type CodeEditorProps = {
  autoComplete?: boolean;
  minimap?: boolean;
};

export default function CodeEditor({
  autoComplete = true,
  minimap = true,
}: CodeEditorProps) {
  const [isAutoCompleted, setIsAutoCompleted] = useState<boolean>(autoComplete);
  const [onlyMyCursor, setOnlyMyCursor] = useState<boolean>(false);

  const { codeEditorSocket: socket } = useToolSocketStore();
  const { nickname } = useUserStore();

  const {
    handleMount,
    isPresenter,
    hasPresenter,
    codeLanguage,
    becomePresenter,
    cancelPresenter,
    changeLanguage,
  } = useCodeEditorSession({
    autoComplete,
    minimap,
    onlyMyCursor,
    nickname,
    socket,
  });

  const toggleAutoComplete = useCallback(() => {
    setIsAutoCompleted((prev) => !prev);
  }, []);

  const toggleOnlyMyCursor = useCallback(() => {
    setOnlyMyCursor((prev) => !prev);
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
