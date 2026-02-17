import { useChatStore } from '@/store/useChatStore';
import { useUserStore } from '@/store/useUserStore';
import { isSameMinute } from '@/utils/chat';
import { ChatListItem } from './ChatListItem';
import { useEffect, useRef } from 'react';
import { useChatScroll } from '@/hooks/chat/useChatScroll';

type Props = {
  scrollRef: React.RefObject<HTMLDivElement | null>;
};

export default function ChatList({ scrollRef }: Props) {
  const { userId } = useUserStore();

  const isFirstRender = useRef(true);

  const messages = useChatStore((s) => s.messages);
  const { handleScroll, scrollToBottom, isAtBottom } = useChatScroll(scrollRef);

  const lastMessage = messages[messages.length - 1];

  // showScrollBtn을 렌더 시점에 계산
  const showScrollBtn =
    messages.length > 0 && !isAtBottom && lastMessage?.userId !== userId;

  useEffect(() => {
    if (!scrollRef.current || messages.length === 0) return;

    if (isFirstRender.current) {
      scrollToBottom();
      isFirstRender.current = false;
      return;
    }

    const lastMessage = messages[messages.length - 1];
    const isMyMessage = lastMessage.userId === userId;

    //    const isImageMessage =
    //      lastMessage.content.type === 'file' &&
    //      lastMessage.content.category === 'image';

    //    // 이미지면 여기서 스크롤하지 않음
    //    if (isImageMessage) return;

    if (isMyMessage || isAtBottom) {
      scrollToBottom(isMyMessage);
      //   setShowScrollBtn(false);
    } else {
      //   setShowScrollBtn(true);
    }
  }, [messages, userId, scrollToBottom, isAtBottom]);

  // const handleImageLoad = useCallback(
  //   (isMine: boolean) => {
  //     if (isAtBottomRef.current || isMine) {
  //       scrollToBottom(true);
  //     }
  //   },
  //   [isAtBottomRef, scrollToBottom],
  // );

  return (
    <section
      ref={scrollRef}
      onScroll={handleScroll}
      className="chat-scrollbar flex-1 overflow-y-auto scroll-smooth pb-4"
    >
      {messages.map((chat, idx) => {
        const prevMsg = messages[idx - 1];

        const isDifferentUser = !prevMsg || prevMsg.userId !== chat.userId;
        const isDifferentTime =
          !prevMsg || !isSameMinute(chat.createdAt, prevMsg.createdAt);

        const showProfile = isDifferentUser || isDifferentTime;

        return (
          <ChatListItem
            key={chat.id}
            {...chat}
            showProfile={showProfile}
            // onImageLoad={() => handleImageLoad(chat.userId === userId)}
          />
        );
      })}

      {showScrollBtn && (
        <button
          onClick={() => {
            scrollToBottom(true);
            // setScrollBtn(false);
          }}
          className="absolute bottom-30 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-4 py-2 text-xs text-white shadow-lg"
        >
          새 메시지 보기 ↓
        </button>
      )}
    </section>
  );
}
