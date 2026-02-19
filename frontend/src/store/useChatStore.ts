import { ChatMessage } from '@/types/chat';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { combine } from 'zustand/middleware';
import { useMeetingStore } from './useMeetingStore';

const initialState: { messages: ChatMessage[] } = {
  messages: [],
};

const useChatStore = create(
  immer(
    combine(initialState, (set) => ({
      actions: {
        addMessage: (msg: ChatMessage) => {
          set((state) => {
            state.messages.push(msg);
          });

          const { isChatOpen, setHasNewChat } = useMeetingStore.getState();
          if (!isChatOpen) setHasNewChat(true);
        },
        reset: () =>
          set((state) => {
            state.messages = [];
          }),
      },
    })),
  ),
);

export const useMessages = () => {
  const messages = useChatStore((store) => store.messages);
  return messages;
};

export const useAddMessage = () => {
  const addMessage = useChatStore((store) => store.actions.addMessage);
  return addMessage;
};

export const useResetMessages = () => {
  const resetMessages = useChatStore((store) => store.actions.reset);
  return resetMessages;
};

export const useMessageLength = () => {
  const messageLenth = useChatStore((store) => store.messages.length);
  return messageLenth;
};

export const useLastMessage = () => {
  const lastMessage = useChatStore(
    (store) => store.messages[store.messages.length - 1],
  );
  return lastMessage;
};
