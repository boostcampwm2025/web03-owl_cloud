import { useWhiteboardAwarenessStore } from '@/store/useWhiteboardAwarenessStore';

describe('useWhiteboardAwarenessStore', () => {
  // 테스트 시작 전 스토어 상태 초기화
  beforeEach(() => {
    const { users, setMyUserId, setUsers } =
      useWhiteboardAwarenessStore.getState();
    setUsers(new Map());
    setMyUserId('');
  });

  it('[초기 상태 설정 확인] 올바르게 초기 설정 되어있는가(초기화 잘 되어 있는가)', () => {
    const state = useWhiteboardAwarenessStore.getState();
    expect(state.users.size).toBe(0);
    expect(state.myUserId).toBe('');
  });

  it('[ID 설정 확인] setMyUserId를 통해 내 ID를 설정되어 있는가', () => {
    useWhiteboardAwarenessStore.getState().setMyUserId('user-1');
    expect(useWhiteboardAwarenessStore.getState().myUserId).toBe('user-1');
  });

  it('[새 사용자 추가 확인] updateUser를 통해 새 사용자를 추가할 수 있는가', () => {
    const userId = 'user-2';
    const userData = { name: 'Test User', color: '#ff0000' };

    useWhiteboardAwarenessStore.getState().updateUser(userId, userData);

    const users = useWhiteboardAwarenessStore.getState().users;
    expect(users.has(userId)).toBe(true);
    expect(users.get(userId)?.name).toBe('Test User');
    expect(users.get(userId)?.id).toBe(userId);
  });

  it('[기존 사용자 정보 업데이트 확인] 기존 사용자의 정보를 업데이트할 수 있는가', () => {
    const userId = 'user-2';
    // 초기 추가
    useWhiteboardAwarenessStore
      .getState()
      .updateUser(userId, { name: 'Initial' });

    // 업데이트 실행
    useWhiteboardAwarenessStore
      .getState()
      .updateUser(userId, { name: 'Updated' });

    const updatedUser = useWhiteboardAwarenessStore
      .getState()
      .users.get(userId);
    expect(updatedUser?.name).toBe('Updated');
  });

  it('[동일한 데이터 업데이트 시 상태 변경 없음 확인] 동일한 데이터로 업데이트 시 상태가 변경되지 않아야 한다 (성능 최적화 확인)', () => {
    const userId = 'user-3';
    const initialData = {
      name: 'Same',
      color: '#000',
      cursor: { x: 10, y: 10 },
      selectedId: null,
    };

    useWhiteboardAwarenessStore.getState().updateUser(userId, initialData);
    const stateBefore = useWhiteboardAwarenessStore.getState().users;

    // 동일한 데이터로 다시 업데이트
    useWhiteboardAwarenessStore.getState().updateUser(userId, initialData);
    const stateAfter = useWhiteboardAwarenessStore.getState().users;

    // 객체 참조 비교: 데이터가 같으므로 이전 Map 객체와 동일해야 함
    expect(stateBefore).toBe(stateAfter);
  });

  it('[사용자 제거 확인] removeUser를 통해 사용자를 제거할 수 있는가', () => {
    const userId = 'user-delete';
    useWhiteboardAwarenessStore
      .getState()
      .updateUser(userId, { name: 'To be deleted' });

    useWhiteboardAwarenessStore.getState().removeUser(userId);

    expect(useWhiteboardAwarenessStore.getState().users.has(userId)).toBe(
      false,
    );
  });
});
