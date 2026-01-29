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

  // 공통 기본 정보 생성 함수
  const createBaseMessage = (id?: string) => ({
    id: id || crypto.randomUUID(),
    userId,
    nickname,
    profileImg,
    createdAt: new Date().toISOString(),
  });

  const sendMessage = (message: string) => {
    const trimmed = message.trim();
    if (trimmed.length === 0 || trimmed.length > 1000 || !socket) return;

    socket.emit('signaling:ws:send_message', { message: trimmed });

    const chatMessage: ChatMessage = {
      ...createBaseMessage(),
      content: { type: 'text', text: trimmed },
    };

    addMessage(chatMessage);
  };

  return { sendMessage };
};
