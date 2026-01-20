'use client';

import CodeEditor from '@/components/code-editor/CodeEditor';
import ChatModal from '@/components/meeting/ChatModal';
import InfoModal from '@/components/meeting/InfoModal';
import MeetingMenu from '@/components/meeting/MeetingMenu';
import MemberModal from '@/components/meeting/MemberModal';
import MemberVideoBar from '@/components/meeting/MemberVideoBar';
import Whiteboard from '@/components/whiteboard/Whiteboard';
import { useProduce } from '@/hooks/useProduce';
import { useMeetingSocketStore } from '@/store/useMeetingSocketStore';
import { useMeetingStore } from '@/store/useMeetingStore';
import { useUserStore } from '@/store/useUserStore';
import { FetchRoomMembersResponse } from '@/types/meeting';
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
  const { socket } = useMeetingSocketStore();
  const { setMembers } = useMeetingStore();
  const { userId } = useUserStore();

  // 초기 입장 시 로비에서 설정한 미디어 Produce
  useEffect(() => {
    if (!isReady || !socket || !userId) return;

    const { audioOn, videoOn } = media;

    const initRoom = async () => {
      try {
        if (audioOn) await startAudioProduce();
        if (videoOn) await startVideoProduce();

        const { main, members } = (await socket.emitWithAck(
          'signaling:ws:room_members',
        )) as FetchRoomMembersResponse;
        setMembers(members.filter((member) => member.user_id !== userId));

        // main으로 화면 공유 중인 경우 처리 구현 필요
      } catch (error) {
        console.error('에러 발생:', error);
      }
    };

    initRoom();
  }, [isReady, socket]);

  // 초기 입장 시 현재 회의에 참여 중인 참가자 정보 저장
  useEffect(() => {
    if (!socket) return;
  }, [socket]);

  return (
    <main className="flex h-screen w-screen flex-col bg-neutral-900">
      <MemberVideoBar />

      <section className="relative flex-1">
        {/* 워크스페이스 / 코드 에디터 등의 컴포넌트가 들어갈 공간 */}
        <div className="flex h-full">
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
