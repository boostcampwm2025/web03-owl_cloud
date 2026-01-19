import { useEffect, RefObject } from 'react';

/**
 * 외부 클릭을 감지하는 유틸 / 훅
 *
 * @param ref 외부 클릭을 감지할 대상 요소의 ref
 * @param handler 외부 클릭 발생 시 실행할 콜백 함수
 * @param enabled 외부 클릭 감지 활성화 여부
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T | null>,
  handler: (event: MouseEvent) => void,
  enabled: boolean = true,
) {
  useEffect(() => {
    if (!enabled) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        handler(event);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [ref, handler, enabled]);
}
