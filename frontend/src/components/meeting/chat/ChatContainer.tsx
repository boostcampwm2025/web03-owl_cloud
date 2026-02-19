import { useChatScroll } from '@/hooks/chat/useChatScroll';
import { useLastMessage, useMessageLength } from '@/store/useChatStore';
import { useCallback, useLayoutEffect, useRef } from 'react';
import ChatList from './ChatList';
import { useUserStore } from '@/store/useUserStore';

export default function ChatContainer() {
  const messageLength = useMessageLength();
  const lastMessage = useLastMessage();
  const userId = useUserStore((s) => s.userId);

  const { ref, isAtBottom, scrollToBottom, handleScroll } = useChatScroll();

  const prevLengthRef = useRef(0);
  const shouldAutoScrollRef = useRef(true);

  const shouldAutoScroll = isAtBottom || lastMessage?.userId === userId;

  useLayoutEffect(() => {
    if (messageLength === 0) return;

    const isFirst = prevLengthRef.current === 0;

    const isImageMessage =
      lastMessage.content.type === 'file' &&
      lastMessage.content.category === 'image';

    // 이미지면 여기서 스크롤하지 않음
    if (isImageMessage) return;

    if (isFirst) {
      scrollToBottom('auto');
    } else {
      shouldAutoScrollRef.current = shouldAutoScroll;

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

  const handleMediaLoad = useCallback(() => {
    // 이미지
    if (shouldAutoScrollRef.current || isAtBottom) {
      requestAnimationFrame(() => {
        scrollToBottom('smooth');
      });
    }
  }, [isAtBottom, scrollToBottom]);

  return (
    <div
      ref={ref}
      onScroll={handleScroll}
      className="chat-scrollbar flex-1 overflow-y-auto scroll-smooth"
    >
      <ChatList onMediaLoad={handleMediaLoad} />

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
