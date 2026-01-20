import { useLayoutEffect, useState, RefObject } from 'react';

export const useElementSize = (ref: RefObject<HTMLElement | null>) => {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    if (!ref.current) return;

    const element = ref.current;

    const updateSize = (entries?: ResizeObserverEntry[]) => {
      if (!element) return;

      if (entries && entries.length > 0) {
        const entry = entries[0];
        const { width, height } = entry.contentRect;

        setSize((prev) => {
          // 1px 이하 차이는 무시
          if (
            Math.abs(prev.width - width) < 1 &&
            Math.abs(prev.height - height) < 1
          ) {
            return prev;
          }
          return { width: Math.floor(width), height: Math.floor(height) };
        });
      } else {
        // 초기 측정
        const { offsetWidth, offsetHeight } = element;
        setSize({ width: offsetWidth, height: offsetHeight });
      }
    };

    updateSize();

    const resizeObserver = new ResizeObserver((entries) => {
      requestAnimationFrame(() => {
        updateSize(entries);
      });
    });

    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, [ref]);

  return size;
};
