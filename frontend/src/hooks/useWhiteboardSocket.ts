import { io, Socket } from 'socket.io-client';
import { useMeetingSocketStore } from '@/store/useMeetingSocketStore';
import { useToolSocketStore } from '@/store/useToolSocketStore';
import { useMeetingStore } from '@/store/useMeetingStore';
import { useCallback } from 'react';

// 환경변수 및 상수 설정
const TOOL_BACKEND_URL = process.env.NEXT_PUBLIC_TOOL_BACKEND_URL;
const SOCKET_PATH = process.env.NEXT_PUBLIC_TOOL_BACKEND_WEBSOCKET_PREFIX;
const NAMESPACE = process.env.NEXT_PUBLIC_TOOL_BACKEND_WEBSOCKET_WHITEBOARD;

export const useWhiteboardSocket = () => {
  const { socket: mainSocket } = useMeetingSocketStore();
  const { setWhiteboardSocket } = useToolSocketStore();
  const { setIsOpen } = useMeetingStore();

  const connectWhiteboard = useCallback(
    (tool: string, ticket: string, type: 'main' | 'sub') => {
      const currentSocket = useToolSocketStore.getState().whiteboardSocket;
      if (currentSocket?.connected) return;

      const meetingId = useMeetingStore.getState().meetingInfo.meetingId;
      const newSocket: Socket = io(`${TOOL_BACKEND_URL}${NAMESPACE}`, {
        path: SOCKET_PATH,
        transports: ['websocket'],
        auth: { token: ticket, type: type },
        query: { room_code: meetingId },
      });

      newSocket.on('connect', () => {
        if (tool === 'whiteboard') {
          setWhiteboardSocket(newSocket);
          setIsOpen('isWhiteboardOpen', true);
        }
      });

      // 연결 해제 시
      newSocket.on('disconnect', () => {
        if (tool === 'whiteboard') setWhiteboardSocket(null);
      });

      return newSocket;
    },
    [setWhiteboardSocket, setIsOpen],
  );

  // 최초 오픈 (main) - 버튼 클릭 시
  const openWhiteboard = useCallback(() => {
    if (!mainSocket) return;

    mainSocket.emit(
      'signaling:ws:open_whiteboard',
      (response: { ticket: string; tool: string }) => {
        const { ticket, tool } = response;
        connectWhiteboard(tool, ticket, 'main');
      },
    );
  }, [mainSocket, connectWhiteboard]);

  // 다른 사용자 참여 (sub) - 이벤트 수신 시
  const joinWhiteboard = useCallback(
    (tool: string) => {
      if (!mainSocket) return;

      mainSocket.emit(
        'signaling:ws:connect_tool',
        { tool },
        (response: { ticket: string }) => {
          if (response?.ticket) {
            connectWhiteboard(tool, response.ticket, 'sub');
          }
        },
      );
    },
    [mainSocket, connectWhiteboard],
  );

  const closeWhiteboard = () => {
    if (!mainSocket) return;

    mainSocket.emit('signaling:ws:disconnect_tool', { tool: 'whiteboard' });

    const { whiteboardSocket } = useToolSocketStore.getState();

    if (whiteboardSocket) {
      whiteboardSocket.emit('whiteboard:disconnect');

      setWhiteboardSocket(null);
    }
  };

  return { openWhiteboard, joinWhiteboard, closeWhiteboard };
};
