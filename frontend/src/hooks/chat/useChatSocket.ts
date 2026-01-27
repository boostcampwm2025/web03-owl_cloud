import { useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { useChatStore } from '@/store/useChatStore';
import { mapRecvPayloadToChatMessage } from '@/utils/chat';
import { RecvMessagePayload } from '@/socket/bindChatSocket';

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
