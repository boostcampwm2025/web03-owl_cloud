import { useMessages } from '@/store/useChatStore';
import { isSameMinute } from '@/utils/chat';
import { ChatListItem } from './ChatListItem';
import { memo, useMemo } from 'react';

type ChatListProps = {
  onMediaLoad?: () => void;
};

function ChatList({ onMediaLoad }: ChatListProps) {
  const messages = useMessages();

  const chatItems = useMemo(
    () =>
      messages.map((chat, idx) => {
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
            onImageLoad={onMediaLoad ? () => onMediaLoad() : undefined}
          />
        );
      }),
    [messages, onMediaLoad],
  );

  return <section className="pb-4">{chatItems}</section>;
}

export default memo(ChatList);
