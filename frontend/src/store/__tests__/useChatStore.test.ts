import { TextContent } from '@/types/chat';
import { useChatStore } from '../useChatStore';
import { useMeetingStore } from '../useMeetingStore';

jest.mock('../useMeetingStore');

const mockMsg = {
  id: '1',
  userId: 'u1',
  nickname: 'nick',
  createdAt: '2026-01-01',
  content: {
    type: 'text',
    text: 'hello',
  } as TextContent,
};

describe('useChatStore', () => {
  beforeEach(() => {
    useChatStore.setState({ messages: [] });

    (useMeetingStore.getState as jest.Mock).mockReturnValue({
      isChatOpen: true,
      setHasNewChat: jest.fn(),
    });
  });

  it('메시지를 추가하면 messages 배열에 포함되어야 한다.', () => {
    useChatStore.getState().addMessage(mockMsg);

    const state = useChatStore.getState();

    expect(state.messages).toHaveLength(1);
    expect(state.messages[0]).toEqual(mockMsg);
  });

  it('메시지를 여러 번 추가하면 누적되어야 한다.', () => {
    const { addMessage } = useChatStore.getState();

    addMessage(mockMsg);
    addMessage(mockMsg);

    expect(useChatStore.getState().messages).toHaveLength(2);
  });

  it('reset 호출 시 messages가 비워져야 한다.', () => {
    const { addMessage, reset } = useChatStore.getState();

    addMessage(mockMsg);
    reset();

    expect(useChatStore.getState().messages).toEqual([]);
  });

  it('채팅창이 닫혀있으면 setHasNewChat이 호출되어야 한다.', () => {
    const setHasNewChat = jest.fn();

    (useMeetingStore.getState as jest.Mock).mockReturnValue({
      isChatOpen: false,
      setHasNewChat,
    });

    useChatStore.getState().addMessage(mockMsg);

    expect(setHasNewChat).toHaveBeenCalledWith(true);
  });

  it('채팅창이 열려있으면 setHasNewChat이 호출되지 않아야 한다.', () => {
    const setHasNewChat = jest.fn();

    (useMeetingStore.getState as jest.Mock).mockReturnValue({
      isChatOpen: true,
      setHasNewChat,
    });

    useChatStore.getState().addMessage(mockMsg);

    expect(setHasNewChat).not.toHaveBeenCalled();
  });
});
