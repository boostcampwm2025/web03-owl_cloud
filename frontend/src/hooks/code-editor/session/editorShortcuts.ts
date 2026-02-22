import { MonacoNamespace } from '@/types/code-editor';
import type * as monaco from 'monaco-editor';
import type * as Y from 'yjs';

export const setupUndoRedoShortcuts = (
  editor: monaco.editor.IStandaloneCodeEditor,
  monacoNs: MonacoNamespace,
  undoManager: Y.UndoManager,
) => {
  editor.addCommand(monacoNs.KeyMod.CtrlCmd | monacoNs.KeyCode.KeyZ, () =>
    undoManager.undo(),
  );
  editor.addCommand(monacoNs.KeyMod.CtrlCmd | monacoNs.KeyCode.KeyY, () =>
    undoManager.redo(),
  );
  editor.addCommand(
    monacoNs.KeyMod.CtrlCmd | monacoNs.KeyMod.Shift | monacoNs.KeyCode.KeyZ,
    () => undoManager.redo(),
  );
};
