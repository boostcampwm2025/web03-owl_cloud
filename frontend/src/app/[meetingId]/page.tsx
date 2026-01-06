'use client';

import ChatModal from '@/components/meeting/ChatModal';
import InfoModal from '@/components/meeting/InfoModal';
import MeetingMenu from '@/components/meeting/MeetingMenu';
import MemberModal from '@/components/meeting/MemberModal';
import MemberVideoBar from '@/components/meeting/MemberVideoBar';
import { useMeeingStore } from '@/store/useMeetingStore';

export default function MeetingPage() {
  const { isInfoOpen, isMemberOpen, isChatOpen } = useMeeingStore();

  return (
    <main className="flex h-screen w-screen flex-col bg-neutral-900">
      <MemberVideoBar />

      <section className="relative flex-1">
        {/* 워크스페이스 / 코드 에디터 등의 컴포넌트가 들어갈 공간 */}

        {/* 참가자 / 채팅창 */}
        {(isMemberOpen || isChatOpen) && (
          <div className="absolute top-2 right-2 bottom-2 flex w-80 flex-col gap-2">
            {isMemberOpen && <MemberModal />}
            {isChatOpen && <ChatModal />}
          </div>
        )}
      </section>

      <MeetingMenu />

      {isInfoOpen && <InfoModal />}
    </main>
  );
}
