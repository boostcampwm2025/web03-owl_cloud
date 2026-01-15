import { Socket } from 'socket.io-client';
import { create } from 'zustand';

interface SocketState {
  socket: Socket | null;
}

interface SocketAction {
  setSocket: (socket: Socket | null) => void;
}

export const useSocketStore = create<SocketState & SocketAction>((set) => ({
  socket: null,

  setSocket: (socket) => set({ socket }),
}));
