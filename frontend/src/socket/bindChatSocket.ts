import { ChatMessage } from '@/types/chat';
import { useChatStore } from '@/store/useChatStore';
import { Socket } from 'socket.io-client';

type RecvMessagePayload = {
  type: 'message';
  message: string;
  nickname: string;
  user_id: string;
  profileImg: string;
};

export const bindChatSocket = (socket: Socket) => {
  const { addMessage } = useChatStore.getState();

  socket.on('room:recv_message', (payload: RecvMessagePayload) => {
    if (payload.type !== 'message') return;

    const chatMessage: ChatMessage = {
      id: crypto.randomUUID(),
      userId: payload.user_id,
      nickname: payload.nickname,
      profileImg: payload.profileImg,
      createdAt: new Date().toISOString(),
      content: {
        type: 'TEXT',
        text: payload.message,
      },
    };

    addMessage(chatMessage);
  });
};
