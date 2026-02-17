import { useChatStore } from '@/store/useChatStore';
import { isSameMinute } from '@/utils/chat';
import { ChatListItem } from './ChatListItem';
import { memo, useMemo } from 'react';

function ChatList() {
  const messages = useChatStore((s) => s.messages);

  const chatItems = useMemo(
    () =>
      messages.map((chat, idx) => {
        const prevMsg = messages[idx - 1];

        const isDifferentUser = !prevMsg || prevMsg.userId !== chat.userId;
        const isDifferentTime =
          !prevMsg || !isSameMinute(chat.createdAt, prevMsg.createdAt);

        const showProfile = isDifferentUser || isDifferentTime;

        return (
          <ChatListItem key={chat.id} {...chat} showProfile={showProfile} />
        );
      }),
    [messages],
  );

  return <section className="pb-4">{chatItems}</section>;
}

export default memo(ChatList);
