import { renderHook, act } from '@testing-library/react';
import { useWindowSize } from '@/hooks/useWindowSize';

describe('useWindowSize', () => {
  const originalInnerWidth = window.innerWidth;
  const originalInnerHeight = window.innerHeight;

  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 768,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: originalInnerHeight,
    });
  });

  it('초기 렌더링 시 현재 window 크기를 반환한다', () => {
    const { result } = renderHook(() => useWindowSize());

    expect(result.current.width).toBe(1024);
    expect(result.current.height).toBe(768);
  });

  it('window resize 이벤트 시 크기가 업데이트된다', () => {
    const { result } = renderHook(() => useWindowSize());

    act(() => {
      window.innerWidth = 1920;
      window.innerHeight = 1080;
      window.dispatchEvent(new Event('resize'));
    });

    expect(result.current.width).toBe(1920);
    expect(result.current.height).toBe(1080);
  });

  it('여러 번 resize 이벤트가 발생해도 정상 동작한다', () => {
    const { result } = renderHook(() => useWindowSize());

    act(() => {
      window.innerWidth = 800;
      window.innerHeight = 600;
      window.dispatchEvent(new Event('resize'));
    });

    expect(result.current.width).toBe(800);
    expect(result.current.height).toBe(600);

    act(() => {
      window.innerWidth = 1440;
      window.innerHeight = 900;
      window.dispatchEvent(new Event('resize'));
    });

    expect(result.current.width).toBe(1440);
    expect(result.current.height).toBe(900);
  });

  it('unmount 시 resize 이벤트 리스너가 제거된다', () => {
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useWindowSize());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'resize',
      expect.any(Function),
    );

    removeEventListenerSpy.mockRestore();
  });

  it('mount 시 resize 이벤트 리스너가 등록된다', () => {
    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    renderHook(() => useWindowSize());

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'resize',
      expect.any(Function),
    );

    addEventListenerSpy.mockRestore();
  });
});
