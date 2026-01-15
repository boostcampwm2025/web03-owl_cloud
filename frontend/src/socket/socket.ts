import { io, Socket } from 'socket.io-client';

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL;
const NAMESPACE = '/signal';
const SOCKET_URL = `${SERVER_URL}${NAMESPACE}`;
const SOCKET_PATH = '/api/ws/';

export const initSocket = (accessToken: string | null) => {
  const socket: Socket = io(SOCKET_URL, {
    path: SOCKET_PATH,
    transports: ['websocket'],
    reconnection: false,
    ...(accessToken && {
      auth: { access_token: accessToken },
      withCredentials: true,
    }),
  });

  return socket;
};
