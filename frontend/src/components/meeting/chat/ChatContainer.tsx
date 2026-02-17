import { useChatScroll } from '@/hooks/chat/useChatScroll';
import { useChatStore } from '@/store/useChatStore';
import { useLayoutEffect, useRef } from 'react';
import ChatList from './ChatList';
import { useUserStore } from '@/store/useUserStore';

export default function ChatContainer() {
  const messageLength = useChatStore((s) => s.messages.length);
  const lastMessage = useChatStore((s) => s.messages[s.messages.length - 1]);
  const userId = useUserStore((s) => s.userId);

  const { ref, isAtBottom, scrollToBottom, handleScroll } = useChatScroll();

  const prevLengthRef = useRef(0);

  const shouldAutoScroll = isAtBottom || lastMessage?.userId === userId;

  useLayoutEffect(() => {
    if (messageLength === 0) return;

    const isFirst = prevLengthRef.current === 0;

    if (isFirst) {
      scrollToBottom('auto');
    } else {
      if (shouldAutoScroll) {
        scrollToBottom(lastMessage?.userId === userId ? 'auto' : 'smooth');
      }
    }

    prevLengthRef.current = messageLength;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messageLength, lastMessage, scrollToBottom, shouldAutoScroll]);

  const hasNewMessage = messageLength > prevLengthRef.current;
  const showScrollButton =
    hasNewMessage && !isAtBottom && lastMessage?.userId !== userId;

  const handleClick = () => {
    scrollToBottom('smooth');
  };

  return (
    <div
      ref={ref}
      onScroll={handleScroll}
      className="chat-scrollbar flex-1 overflow-y-auto scroll-smooth"
    >
      <ChatList />

      {showScrollButton && (
        <button
          onClick={handleClick}
          className="absolute bottom-28 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-4 py-2 text-xs text-white shadow-lg"
        >
          새 메시지 보기 ↓
        </button>
      )}
    </div>
  );
}
