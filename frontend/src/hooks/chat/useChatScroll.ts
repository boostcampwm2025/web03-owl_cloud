import { RefObject, useRef } from 'react';

export const useChatScroll = (
  containerRef: RefObject<HTMLDivElement | null>,
) => {
  const isAtBottomRef = useRef(true);
  const THRESHOLD = 150;

  const checkIsNearBottom = () => {
    const el = containerRef.current;
    if (!el) return true;

    return el.scrollHeight - el.scrollTop - el.clientHeight < THRESHOLD;
  };

  const handleScroll = () => {
    isAtBottomRef.current = checkIsNearBottom();
  };

  const scrollToBottom = (isMyMessage = false) => {
    const el = containerRef.current;
    if (!el) return;

    el.scrollTo({
      top: el.scrollHeight,
      behavior: isMyMessage ? 'auto' : 'smooth',
    });
  };

  return { handleScroll, scrollToBottom, isAtBottomRef };
};
