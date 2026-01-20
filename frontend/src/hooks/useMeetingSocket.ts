import { initSocket } from '@/socket/socket';
import { useMeetingSocketStore } from '@/store/useMeetingSocketStore';
import { useEffect } from 'react';

export const useMeetingSocket = () => {
  const { socket, setSocket } = useMeetingSocketStore();

  useEffect(() => {
    // 브라우저 환경인지(sessionStorage 준비 여부)
    // 이미 소켓 연결이 진행되었는지 확인
    if (typeof window === 'undefined' || socket) return;

    const accessToken = sessionStorage.getItem('access_token');
    const tempSocket = initSocket(accessToken);

    const onConnect = () => {
      console.log('연결 완료');
    };
    tempSocket.on('connect', onConnect);

    const onDisconnect = (reason: string) => {
      console.log(reason);
    };
    tempSocket.on('disconnect', onDisconnect);

    const onConnectError = (err: Error) => {
      console.error(err);
    };
    tempSocket.on('connect_error', onConnectError);

    const onTokenRefresh = ({ access_token }: { access_token: string }) => {
      sessionStorage.setItem('access_token', access_token);
    };
    tempSocket.on('auth:access_token', onTokenRefresh);

    setSocket(tempSocket);

    return () => {
      tempSocket.off('connect', onConnect);
      tempSocket.off('disconnect', onDisconnect);
      tempSocket.off('connect_error', onConnectError);
      tempSocket.off('auth:access_token', onTokenRefresh);
      tempSocket.disconnect();
      setSocket(null);
    };
  }, []);

  return { socket };
};
