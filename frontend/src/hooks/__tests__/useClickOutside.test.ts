import { renderHook } from '@testing-library/react';
import { useClickOutside } from '../useClickOutside';

describe('useClickOutside', () => {
  const handler = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createRef = (element: HTMLElement | null) => ({
    current: element,
  });

  it('[외부 클릭 감지 확인] 대상 요소 외부를 클릭했을 때 핸들러가 호출되는가', () => {
    // 내부 요소와 외부 요소 생성
    const insideElement = document.createElement('div');
    const outsideElement = document.createElement('div');
    document.body.appendChild(insideElement);
    document.body.appendChild(outsideElement);

    const ref = createRef(insideElement);
    renderHook(() => useClickOutside(ref, handler));

    // 외부 클릭 시뮬레이션
    document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

    expect(handler).toHaveBeenCalledTimes(1);

    document.body.removeChild(insideElement);
    document.body.removeChild(outsideElement);
  });

  it('[내부 클릭 무시 확인] 대상 요소 내부를 클릭했을 때 핸들러가 호출되지 않는가', () => {
    const insideElement = document.createElement('div');
    document.body.appendChild(insideElement);

    const ref = createRef(insideElement);
    renderHook(() => useClickOutside(ref, handler));

    // 내부 클릭 시뮬레이션 (event.target을 insideElement로 설정)
    const event = new MouseEvent('mousedown', { bubbles: true });
    Object.defineProperty(event, 'target', {
      value: insideElement,
      enumerable: true,
    });
    document.dispatchEvent(event);

    expect(handler).not.toHaveBeenCalled();

    document.body.removeChild(insideElement);
  });

  it('[비활성화 확인] enabled가 false일 때 외부를 클릭해도 핸들러가 호출되지 않는가', () => {
    const insideElement = document.createElement('div');
    const ref = createRef(insideElement);

    renderHook(() => useClickOutside(ref, handler, false));

    document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

    expect(handler).not.toHaveBeenCalled();
  });

  it('[터치 이벤트 감지 확인] 모바일 환경(touchstart)에서도 외부 클릭을 감지하는가', () => {
    const insideElement = document.createElement('div');
    const ref = createRef(insideElement);

    renderHook(() => useClickOutside(ref, handler));

    // 터치 이벤트 발생
    document.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));

    expect(handler).toHaveBeenCalledTimes(1);
  });
});
