import { useChatStore } from '@/store/useChatStore';
import { ChatMessage } from '@/types/chat';
import { Socket } from 'socket.io-client';

interface ChatSenderParams {
  socket: Socket | null;
  userId: string;
  nickname: string;
  profileImg: string;
}

export const useChatSender = ({
  socket,
  userId,
  nickname,
  profileImg,
}: ChatSenderParams) => {
  const addMessage = useChatStore((s) => s.addMessage);

  const sendMessage = (message: string) => {
    const trimmed = message.trim();
    if (trimmed.length === 0) return;
    if (trimmed.length > 1000) return;

    if (!socket) return;

    socket.emit('signaling:ws:send_message', {
      message: trimmed,
    });

    const chatMessage: ChatMessage = {
      id: crypto.randomUUID(),
      userId,
      nickname,
      profileImg,
      createdAt: new Date().toISOString(),
      content: {
        type: 'TEXT',
        text: trimmed,
      },
    };

    addMessage(chatMessage);
  };
  return { sendMessage };
};
