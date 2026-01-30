import { io } from 'socket.io-client';
import { useMeetingSocketStore } from '@/store/useMeetingSocketStore';
import { useToolSocketStore } from '@/store/useToolSocketStore';
import { useMeetingStore } from '@/store/useMeetingStore';
import { useCallback } from 'react';

const TOOL_BACKEND_URL = process.env.NEXT_PUBLIC_TOOL_BACKEND_URL;
const NAMESPACE = process.env.NEXT_PUBLIC_TOOL_BACKEND_WEBSOCKET_PREFIX;

export const useCodeEditorSocket = () => {
  const { socket: mainSocket } = useMeetingSocketStore(); // 시그널링 메인 소켓

  const { setCodeEditorSocket } = useToolSocketStore();
  const { setIsOpen } = useMeetingStore();

  const connectToTool = useCallback(
    (tool: string, ticket: string, type: 'main' | 'sub') => {
      const currentSocket = useToolSocketStore.getState().codeEditorSocket;
      if (currentSocket?.connected) return;

      const meetingId = useMeetingStore.getState().meetingInfo.meetingId;

      const newSocket = io(`${TOOL_BACKEND_URL}/${tool}`, {
        path: `${NAMESPACE}`,
        transports: ['websocket'],
        auth: { token: ticket, type },
        query: { room_code: meetingId },
      });

      newSocket.on('connect', () => {
        if (tool === 'codeeditor') {
          setCodeEditorSocket(newSocket);
          setIsOpen('isCodeEditorOpen', true);
        }
      });

      newSocket.on('disconnect', () => {
        if (tool === 'codeeditor') setCodeEditorSocket(null);
      });

      return newSocket;
    },
    [setCodeEditorSocket, setIsOpen],
  );

  // 최초 툴 opener
  const openCodeEditor = () => {
    if (!mainSocket) return;

    mainSocket.emit(
      'signaling:ws:open_codeeditor',
      (response: { ticket: string; tool: string }) => {
        const { ticket, tool } = response;
        connectToTool(tool, ticket, 'main');
      },
    );
  };

  // 다른 유저의 연결 요청 처리
  const joinCodeEditor = useCallback(
    (tool: string) => {
      if (!mainSocket) return;

      mainSocket.emit(
        'signaling:ws:connect_tool',
        { tool },
        (response: { ticket: string }) => {
          if (response?.ticket) {
            connectToTool(tool, response.ticket, 'sub');
          }
        },
      );
    },
    [mainSocket, connectToTool],
  );

  // 공유 중단
  const closeCodeEditor = () => {
    if (!mainSocket) return;

    mainSocket.emit('signaling:ws:disconnect_tool', { tool: 'codeeditor' });

    const { codeEditorSocket } = useToolSocketStore.getState();

    if (codeEditorSocket) {
      codeEditorSocket.off();
      codeEditorSocket.disconnect();
      setCodeEditorSocket(null);
    }
  };

  return { openCodeEditor, joinCodeEditor, closeCodeEditor };
};
