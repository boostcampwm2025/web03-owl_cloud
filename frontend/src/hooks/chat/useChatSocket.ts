import { useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { useChatStore } from '@/store/useChatStore';
import { mapRecvPayloadToChatMessage } from '@/utils/chat';
import { FileCategory } from '@/types/chat';

type BaseUserPayload = {
  user_id: string;
  nickname: string;
  profileImg?: string;
};

type TextMessagePayload = {
  type: 'message';
  message: string;
};

type FileMessagePayload = {
  type: 'file';
  file_id: string;
  filename: string;
  thumbnail_url: string;
  size: number;
  category: FileCategory;
};

export type RecvMessagePayload =
  | (TextMessagePayload & BaseUserPayload)
  | (FileMessagePayload & BaseUserPayload);

export const useChatSocket = (socket: Socket | null) => {
  const addMessage = useChatStore((s) => s.addMessage);

  useEffect(() => {
    if (!socket) return;

    const handler = (payload: RecvMessagePayload) => {
      const chatMessage = mapRecvPayloadToChatMessage(payload);
      addMessage(chatMessage);
    };

    socket.on('room:recv_message', handler);

    return () => {
      socket.off('room:recv_message', handler);
    };
  }, [socket, addMessage]);
};
