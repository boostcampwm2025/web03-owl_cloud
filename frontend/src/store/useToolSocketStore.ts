import { create } from 'zustand';
import { Socket } from 'socket.io-client';

interface ToolSocketState {
  codeEditorSocket: Socket | null;
}

interface ToolSocketAction {
  setCodeEditorSocket: (socket: Socket | null) => void;
}

export const useToolSocketStore = create<ToolSocketState & ToolSocketAction>(
  (set) => ({
    codeEditorSocket: null,

    setCodeEditorSocket: (socket) => set({ codeEditorSocket: socket }),
  }),
);
