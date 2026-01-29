import { ChatMessage } from '@/types/chat';
import { create } from 'zustand';

interface ChatState {
  messages: ChatMessage[];
}

interface ChatAction {
  addMessage: (msg: ChatMessage) => void;
  reset: () => void;
}

export const useChatStore = create<ChatState & ChatAction>((set) => ({
  messages: [],

  addMessage: (msg) =>
    set((state) => ({
      messages: [...state.messages, msg],
    })),
  reset: () => set({ messages: [] }),
}));
