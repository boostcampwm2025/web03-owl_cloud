import { DUMMY_CHATS } from '@/app/[meetingId]/dummy';
import { CloseIcon, ImageIcon } from '@/assets/icons/common';
import { FileIcon, SendIcon } from '@/assets/icons/meeting';
import ChatListItem from '@/components/meeting/ChatListItem';
import { useMeetingStore } from '@/store/useMeetingStore';
import { MouseEvent, useState } from 'react';

export default function ChatModal() {
  const chats = DUMMY_CHATS;

  const { setIsOpen } = useMeetingStore();
  const [value, setValue] = useState('');
  const [files, setFiles] = useState([]);

  const onCloseClick = () => setIsOpen('isChatOpen', false);

  // 이후 form 관련 라이브러리 사용 시 수정 필요
  const onSubmit = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (value.trim().length === 0) return;

    setValue('');
  };

  // Enter 시 Submit
  // Shift + Enter 시 줄바꿈
  // textarea 자동 높이 조절 추가하면 좋을 것 같아요

  return (
    <aside className="meeting-side-modal z-6">
      <div className="flex-center relative h-12 w-full bg-neutral-800">
        <span className="font-bold text-neutral-200">채팅</span>
        <button
          className="absolute top-2 right-2 rounded-sm p-1 hover:bg-neutral-700"
          onClick={onCloseClick}
        >
          <CloseIcon className="h-6 w-6 text-neutral-200" />
        </button>
      </div>

      {/* 채팅 내역 */}
      <section className="flex-1 overflow-y-auto">
        {chats.map((chat) => (
          <ChatListItem key={chat.id} {...chat} />
        ))}
      </section>

      {/* 채팅 입력 부분 */}
      <form className="border-t border-neutral-600">
        {/* 파일 업로드 현황 */}
        {files.length > 0 && <div></div>}

        {/* 텍스트 input */}
        <textarea
          className="w-full resize-none px-2 pt-3 pb-1 text-sm text-neutral-50 placeholder:text-neutral-400 focus:outline-none"
          placeholder="메세지를 입력해주세요"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        ></textarea>

        {/* 버튼 */}
        <div className="flex justify-between p-2">
          {/* 이미지, 파일 로직 추가 후 수정 필요 */}
          <div className="flex gap-1 text-neutral-200">
            <button
              type="button"
              className="rounded-sm p-1 hover:bg-neutral-600"
            >
              <ImageIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="rounded-sm p-1 hover:bg-neutral-600"
            >
              <FileIcon />
            </button>
          </div>

          <button
            type="submit"
            className={`rounded-sm p-1 ${value.length > 0 ? 'text-neutral-200 hover:bg-neutral-600' : 'cursor-default! text-neutral-400'}`}
            onClick={onSubmit}
          >
            <SendIcon className="h-4 w-4" />
          </button>
        </div>
      </form>
    </aside>
  );
}
