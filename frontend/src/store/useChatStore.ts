import { ChatMessage } from '@/types/chat';
import { create } from 'zustand';
import { useMeetingStore } from './useMeetingStore';

interface ChatState {
  messages: ChatMessage[];
}

interface ChatAction {
  addMessage: (msg: ChatMessage) => void;
  reset: () => void;
}

export const useChatStore = create<ChatState & ChatAction>((set) => ({
  messages: [],

  addMessage: (msg) => {
    set((state) => ({
      messages: [...state.messages, msg],
    }));

    const { isChatOpen, setHasNewChat } = useMeetingStore.getState();
    if (!isChatOpen) {
      setHasNewChat(true);
    }
  },
  reset: () => set({ messages: [] }),
}));
