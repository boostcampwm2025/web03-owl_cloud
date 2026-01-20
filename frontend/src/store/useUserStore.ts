import { create } from 'zustand';

interface UserState {
  userId: string;
  email: string;
  profilePath: string | null;
  nickname: string;
  isLoggedIn: boolean;
  isLoaded: boolean;
}

interface UserAction {
  setUser: (state: Partial<UserState>) => void;
  setTempUser: (state: Partial<Pick<UserState, 'userId' | 'nickname'>>) => void;
  setIsLoaded: () => void;
}

export const useUserStore = create<UserState & UserAction>((set) => ({
  userId: '',
  email: '',
  profilePath: '',
  nickname: '',
  isLoggedIn: false,
  isLoaded: false,

  setUser: (state) => set({ ...state, isLoggedIn: true, isLoaded: true }),
  setTempUser: (state) => set((prev) => ({ ...prev, ...state })),
  setIsLoaded: () => set({ isLoaded: true }),
}));
