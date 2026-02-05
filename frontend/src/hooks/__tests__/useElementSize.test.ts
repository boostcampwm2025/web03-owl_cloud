import { renderHook, act } from '@testing-library/react';
import { useElementSize } from '@/hooks/useElementSize';
import { RefObject } from 'react';

describe('useElementSize', () => {
  let mockObserve: jest.Mock;
  let mockUnobserve: jest.Mock;
  let mockDisconnect: jest.Mock;
  let resizeCallback: ResizeObserverCallback;

  beforeEach(() => {
    mockObserve = jest.fn();
    mockUnobserve = jest.fn();
    mockDisconnect = jest.fn();

    global.ResizeObserver = jest.fn().mockImplementation((callback) => {
      resizeCallback = callback;
      return {
        observe: mockObserve,
        unobserve: mockUnobserve,
        disconnect: mockDisconnect,
      };
    });

    global.requestAnimationFrame = jest.fn((cb) => {
      cb(0);
      return 0;
    });

    global.cancelAnimationFrame = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('ref에 요소가 있으면 ResizeObserver가 observe한다', () => {
    const element = document.createElement('div');
    const ref: RefObject<HTMLDivElement> = { current: element };

    renderHook(() => useElementSize(ref));

    expect(mockObserve).toHaveBeenCalledWith(element);
  });

  it('요소 크기 변경 시 크기가 업데이트된다', () => {
    const element = document.createElement('div');
    const ref: RefObject<HTMLDivElement> = { current: element };

    const { result } = renderHook(() => useElementSize(ref));

    act(() => {
      const entries: ResizeObserverEntry[] = [
        {
          target: element,
          contentRect: {
            width: 800,
            height: 600,
            top: 0,
            left: 0,
            bottom: 600,
            right: 800,
            x: 0,
            y: 0,
          } as DOMRectReadOnly,
          borderBoxSize: [],
          contentBoxSize: [],
          devicePixelContentBoxSize: [],
        },
      ];
      resizeCallback(entries, {} as ResizeObserver);
    });

    expect(result.current.width).toBe(800);
    expect(result.current.height).toBe(600);
  });

  it('1px 미만 차이는 무시한다 (성능 최적화)', () => {
    const element = document.createElement('div');
    const ref: RefObject<HTMLDivElement> = { current: element };

    const { result } = renderHook(() => useElementSize(ref));

    act(() => {
      const entries: ResizeObserverEntry[] = [
        {
          target: element,
          contentRect: {
            width: 800,
            height: 600,
            top: 0,
            left: 0,
            bottom: 600,
            right: 800,
            x: 0,
            y: 0,
          } as DOMRectReadOnly,
          borderBoxSize: [],
          contentBoxSize: [],
          devicePixelContentBoxSize: [],
        },
      ];
      resizeCallback(entries, {} as ResizeObserver);
    });

    expect(result.current.width).toBe(800);
    expect(result.current.height).toBe(600);

    act(() => {
      const entries: ResizeObserverEntry[] = [
        {
          target: element,
          contentRect: {
            width: 800.5,
            height: 600.5,
            top: 0,
            left: 0,
            bottom: 600.5,
            right: 800.5,
            x: 0,
            y: 0,
          } as DOMRectReadOnly,
          borderBoxSize: [],
          contentBoxSize: [],
          devicePixelContentBoxSize: [],
        },
      ];
      resizeCallback(entries, {} as ResizeObserver);
    });

    expect(result.current.width).toBe(800);
    expect(result.current.height).toBe(600);
  });

  it('1px 이상 차이는 업데이트한다', () => {
    const element = document.createElement('div');
    const ref: RefObject<HTMLDivElement> = { current: element };

    const { result } = renderHook(() => useElementSize(ref));

    act(() => {
      const entries: ResizeObserverEntry[] = [
        {
          target: element,
          contentRect: {
            width: 800,
            height: 600,
            top: 0,
            left: 0,
            bottom: 600,
            right: 800,
            x: 0,
            y: 0,
          } as DOMRectReadOnly,
          borderBoxSize: [],
          contentBoxSize: [],
          devicePixelContentBoxSize: [],
        },
      ];
      resizeCallback(entries, {} as ResizeObserver);
    });

    act(() => {
      const entries: ResizeObserverEntry[] = [
        {
          target: element,
          contentRect: {
            width: 802,
            height: 602,
            top: 0,
            left: 0,
            bottom: 602,
            right: 802,
            x: 0,
            y: 0,
          } as DOMRectReadOnly,
          borderBoxSize: [],
          contentBoxSize: [],
          devicePixelContentBoxSize: [],
        },
      ];
      resizeCallback(entries, {} as ResizeObserver);
    });

    expect(result.current.width).toBe(802);
    expect(result.current.height).toBe(602);
  });

  it('unmount 시 ResizeObserver가 disconnect된다', () => {
    const element = document.createElement('div');
    const ref: RefObject<HTMLDivElement> = { current: element };

    const { unmount } = renderHook(() => useElementSize(ref));

    unmount();

    expect(mockDisconnect).toHaveBeenCalled();
  });

  it('requestAnimationFrame을 사용하여 업데이트를 최적화한다', () => {
    const element = document.createElement('div');
    const ref: RefObject<HTMLDivElement> = { current: element };

    renderHook(() => useElementSize(ref));

    act(() => {
      const entries: ResizeObserverEntry[] = [
        {
          target: element,
          contentRect: {
            width: 800,
            height: 600,
            top: 0,
            left: 0,
            bottom: 600,
            right: 800,
            x: 0,
            y: 0,
          } as DOMRectReadOnly,
          borderBoxSize: [],
          contentBoxSize: [],
          devicePixelContentBoxSize: [],
        },
      ];
      resizeCallback(entries, {} as ResizeObserver);
    });

    expect(global.requestAnimationFrame).toHaveBeenCalled();
  });

  it('unmount 시 pending된 requestAnimationFrame이 취소된다', () => {
    const element = document.createElement('div');
    const ref: RefObject<HTMLDivElement> = { current: element };

    const { unmount } = renderHook(() => useElementSize(ref));

    unmount();

    expect(mockDisconnect).toHaveBeenCalled();
  });
});
