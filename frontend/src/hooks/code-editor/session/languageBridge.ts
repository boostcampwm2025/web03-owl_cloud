import type * as monaco from 'monaco-editor';
import type * as Y from 'yjs';

import type { EditorLanguage } from '@/constants/code-editor';
import type { LanguageState, MonacoNamespace } from '@/types/code-editor';

export const setupLanguageObserver = (
  ydoc: Y.Doc,
  model: monaco.editor.ITextModel,
  monacoNs: MonacoNamespace,
  setCodeLanguage: (lang: EditorLanguage) => void,
) => {
  const yLanguage = ydoc.getMap<LanguageState>('language');

  const onLanguageChange = () => {
    const lang = yLanguage.get('current');
    if (!lang) return;

    if (model.getLanguageId() !== lang.value) {
      monacoNs.editor.setModelLanguage(model, lang.value);
      setCodeLanguage(lang.value);
    }
  };

  yLanguage.observe(onLanguageChange);

  return () => {
    yLanguage.unobserve(onLanguageChange);
  };
};
