import { create } from 'zustand';

export interface User {
  id: string;
  name: string;
  color: string;
  cursor: { x: number; y: number } | null;
  selectedId: string | null;
}

interface AwarenessState {
  // 다른 사용자들의 상태 (userId -> User)
  users: Map<string, User>;
  myUserId: string;
}

interface AwarenessActions {
  setUsers: (users: Map<string, User>) => void;
  setMyUserId: (userId: string) => void;
  updateUser: (userId: string, data: Partial<User>) => void;
  removeUser: (userId: string) => void;
}

type AwarenessStore = AwarenessState & AwarenessActions;

// 다른 사용자의 실시간 상태 관리(커서 위치, 선택 아이템)
export const useWhiteboardAwarenessStore = create<AwarenessStore>((set) => ({
  // 초기값
  users: new Map(),
  myUserId: '',

  setUsers: (users) => set({ users }),
  setMyUserId: (userId) => set({ myUserId: userId }),

  // 사용자 정보 업데이트
  updateUser: (userId, data) =>
    set((state) => {
      const newUsers = new Map(state.users);
      const user = newUsers.get(userId);
      if (user) {
        newUsers.set(userId, { ...user, ...data });
      } else {
        // 새 사용자 추가
        newUsers.set(userId, {
          id: userId,
          name: data.name || 'Anonymous',
          color: data.color || '#000000',
          cursor: data.cursor || null,
          selectedId: data.selectedId || null,
        });
      }
      return { users: newUsers };
    }),

  // 사용자 제거
  removeUser: (userId) =>
    set((state) => {
      const newUsers = new Map(state.users);
      newUsers.delete(userId);
      return { users: newUsers };
    }),
}));
