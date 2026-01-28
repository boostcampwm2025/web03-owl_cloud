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

  // 연결 함수
  const connectWhiteboard = useCallback(
    (ticket: string, type: 'main' | 'sub') => {
      // 이미 연결된 상태면 중복 연결 방지
      const currentSocket = useToolSocketStore.getState().whiteboardSocket;
      if (currentSocket?.connected) return;

      // 소켓 인스턴스 생성 및 연결 시도
      const newSocket: Socket = io(`${TOOL_BACKEND_URL}${NAMESPACE}`, {
        path: SOCKET_PATH,
        transports: ['websocket'],
        auth: {
          token: ticket,
          type: type,
        },
      });

      // 이벤트 리스너 설정
      // 연결 성공 시
      newSocket.on('connect', () => {
        // 스토어에 소켓 저장(다른 컴포넌트에서도 써야함)
        setWhiteboardSocket(newSocket);

        // 워크스페이스 열기
        setIsOpen('isWhiteboardOpen', true);
      });

      // 연결 실패 시
      newSocket.on('connect_error', (err) => {
        console.error('Whiteboard 연결 실패 : ', err.message);
      });

      // 연결 해제 시
      newSocket.on('disconnect', (reason) => {
        console.log('Whiteboard 연결 끊김 : ', reason);
        setWhiteboardSocket(null);
      });

      // 백엔드에서 보내주는 권한 확인 메시지
      newSocket.on('whiteboard:permission', (data) => {
        console.log('Whiteboard 권한 확인:', data);
      });
    },
    [setWhiteboardSocket, setIsOpen],
  );

  // 최초 오픈 (main) - 버튼 클릭 시
  const openWhiteboard = useCallback(() => {
    if (!mainSocket) return;

    mainSocket.emit(
      'signaling:ws:open_whiteboard',
      (response: { ticket: string; tool: string }) => {
        const { ticket } = response;
        connectWhiteboard(ticket, 'main');
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
            connectWhiteboard(response.ticket, 'sub');
          }
        },
      );
    },
    [mainSocket, connectWhiteboard],
  );

  // 연결 해제
  const closeWhiteboard = useCallback(() => {
    if (!mainSocket) return;

    mainSocket.emit('signaling:ws:disconnect_tool', { tool: 'whiteboard' });

    // 현재 소켓 가져오기
    const { whiteboardSocket } = useToolSocketStore.getState();

    if (whiteboardSocket) {
      // 소켓 연결 해제
      whiteboardSocket.disconnect();
      // 스토어 비우기
      setWhiteboardSocket(null);
    }

    setIsOpen('isWhiteboardOpen', false);
  }, [mainSocket, setWhiteboardSocket, setIsOpen]);

  return { openWhiteboard, joinWhiteboard, closeWhiteboard };
};
