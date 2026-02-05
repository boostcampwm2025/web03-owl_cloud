import { act } from '@testing-library/react';
import { useUserStore } from '@/store/useUserStore';

describe('useUserStore', () => {
  beforeEach(() => {
    act(() => {
      useUserStore.setState({
        userId: '',
        email: '',
        profilePath: '',
        nickname: '',
        isLoggedIn: false,
        isLoaded: false,
      });
    });
  });

  it('초기 상태는 로그아웃 상태이다', () => {
    const state = useUserStore.getState();

    expect(state.userId).toBe('');
    expect(state.email).toBe('');
    expect(state.profilePath).toBe('');
    expect(state.nickname).toBe('');
    expect(state.isLoggedIn).toBe(false);
    expect(state.isLoaded).toBe(false);
  });

  it('setUser는 사용자 정보를 설정하고 로그인 상태로 만든다', () => {
    const { setUser } = useUserStore.getState();

    act(() => {
      setUser({
        userId: 'user-1',
        email: 'test@example.com',
        nickname: '테스터',
        profilePath: '/profile.png',
      });
    });

    const state = useUserStore.getState();

    expect(state.userId).toBe('user-1');
    expect(state.email).toBe('test@example.com');
    expect(state.nickname).toBe('테스터');
    expect(state.profilePath).toBe('/profile.png');

    expect(state.isLoggedIn).toBe(true);
    expect(state.isLoaded).toBe(true);
  });

  it('setUser는 일부 필드만 전달해도 정상 동작한다', () => {
    const { setUser } = useUserStore.getState();

    act(() => {
      setUser({
        userId: 'user-2',
        nickname: '임시유저',
      });
    });

    const state = useUserStore.getState();

    expect(state.userId).toBe('user-2');
    expect(state.nickname).toBe('임시유저');
    expect(state.email).toBe('');
    expect(state.profilePath).toBe('');

    expect(state.isLoggedIn).toBe(true);
    expect(state.isLoaded).toBe(true);
  });

  it('setTempUser는 userId와 nickname만 임시로 설정한다', () => {
    const { setTempUser } = useUserStore.getState();

    act(() => {
      setTempUser({
        userId: 'temp-user',
        nickname: '임시닉네임',
      });
    });

    const state = useUserStore.getState();

    expect(state.userId).toBe('temp-user');
    expect(state.nickname).toBe('임시닉네임');

    // 로그인 상태에는 영향 없음
    expect(state.isLoggedIn).toBe(false);
    expect(state.isLoaded).toBe(false);
  });

  it('setTempUser는 기존 상태를 덮어쓰지 않는다', () => {
    const { setUser, setTempUser } = useUserStore.getState();

    act(() => {
      setUser({
        userId: 'user-1',
        email: 'user@test.com',
        nickname: '유저',
      });
    });

    act(() => {
      setTempUser({
        nickname: '임시닉',
      });
    });

    const state = useUserStore.getState();

    expect(state.userId).toBe('user-1');
    expect(state.nickname).toBe('임시닉');
    expect(state.email).toBe('user@test.com');
  });

  it('setIsLoaded는 isLoaded를 true로 만든다', () => {
    const { setIsLoaded } = useUserStore.getState();

    act(() => {
      setIsLoaded();
    });

    expect(useUserStore.getState().isLoaded).toBe(true);
  });

  it('setIsLoaded는 여러 번 호출해도 안전하다', () => {
    const { setIsLoaded } = useUserStore.getState();

    act(() => {
      setIsLoaded();
      setIsLoaded();
      setIsLoaded();
    });

    expect(useUserStore.getState().isLoaded).toBe(true);
  });
});
