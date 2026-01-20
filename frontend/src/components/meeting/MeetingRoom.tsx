'use client';

import CodeEditor from '@/components/code-editor/CodeEditor';
import ChatModal from '@/components/meeting/ChatModal';
import InfoModal from '@/components/meeting/InfoModal';
import MeetingMenu from '@/components/meeting/MeetingMenu';
import MemberModal from '@/components/meeting/MemberModal';
import MemberVideoBar from '@/components/meeting/MemberVideoBar';
import Whiteboard from '@/components/whiteboard/Whiteboard';
import { useProduce } from '@/hooks/useProduce';
import { useMeetingStore } from '@/store/useMeetingStore';
import { useEffect } from 'react';

export default function MeetingRoom({ meetingId }: { meetingId: string }) {
  const {
    media,
    isInfoOpen,
    isMemberOpen,
    isChatOpen,
    isWorkspaceOpen,
    isCodeEditorOpen,
  } = useMeetingStore();
  const { startAudioProduce, startVideoProduce, isReady } = useProduce();

  // 초기 입장 시 로비에서 설정한 미디어 Produce
  useEffect(() => {
    if (!isReady) return;

    const { audioOn, videoOn } = media;
    if (audioOn) startAudioProduce();
    if (videoOn) startVideoProduce();
  }, [isReady]);

  return (
    <main className="flex h-screen w-full flex-col overflow-hidden bg-neutral-900">
      <MemberVideoBar />

      <section className="relative flex-1 overflow-hidden">
        {/* 워크스페이스 / 코드 에디터 등의 컴포넌트가 들어갈 공간 */}
        <div className="flex h-full w-full overflow-hidden">
          {isWorkspaceOpen && (
            <div
              className={isCodeEditorOpen ? 'h-full w-1/2' : 'h-full w-full'}
            >
              <Whiteboard />
            </div>
          )}
          {isCodeEditorOpen && (
            <div className={isWorkspaceOpen ? 'h-full w-1/2' : 'h-full w-full'}>
              <CodeEditor />
            </div>
          )}
        </div>

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
