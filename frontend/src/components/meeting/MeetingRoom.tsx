'use client';

import CodeEditor from '@/components/code-editor/CodeEditor';
import ChatModal from '@/components/meeting/ChatModal';
import { GlobalAudioPlayer } from '@/components/meeting/GlobalAudioPlayer';
import InfoModal from '@/components/meeting/InfoModal';
import MeetingMenu from '@/components/meeting/MeetingMenu';
import MemberModal from '@/components/meeting/MemberModal';
import MemberVideoBar from '@/components/meeting/MemberVideoBar';
import Whiteboard from '@/components/whiteboard/Whiteboard';
import { useProduce } from '@/hooks/useProduce';
import { useMeetingSocketStore } from '@/store/useMeetingSocketStore';
import { useMeetingStore } from '@/store/useMeetingStore';
import { useUserStore } from '@/store/useUserStore';
import {
  FetchRoomMembersResponse,
  MeetingMemberInfo,
  ProducerInfo,
} from '@/types/meeting';
import { createConsumeHelpers } from '@/utils/createConsumeHelpers';
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
  const { socket, device, recvTransport, addConsumer, removeConsumer } =
    useMeetingSocketStore();
  const {
    setMembers,
    addMember,
    removeMember,
    setMemberStream,
    removeMemberStream,
  } = useMeetingStore();
  const { userId } = useUserStore();

  // 초기 입장 시 로비에서 설정한 미디어 Produce
  useEffect(() => {
    if (!isReady || !socket || !userId) return;

    const { audioOn, videoOn } = media;

    const initRoom = async () => {
      try {
        if (audioOn) await startAudioProduce();
        if (videoOn) await startVideoProduce();

        // 현재 회의에 참여 중인 참가자 정보 저장
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

  // 입장, 퇴장하는 사용자 처리
  useEffect(() => {
    if (!socket) return;

    const onNewUser = async (userInfo: MeetingMemberInfo) => {
      addMember(userInfo);
    };
    socket.on('room:new_user', onNewUser);
    const onUserClosed = async (userId: string) => {
      removeMember(userId);
      removeConsumer(userId);
    };
    socket.on('room:user_closed', onUserClosed);
    return () => {
      socket.off('room:new_user', onNewUser);
      socket.off('room:user_closed', onUserClosed);
    };
  }, [socket]);

  // produce 발생 시 consume
  useEffect(() => {
    if (!socket || !device || !recvTransport) return;

    const { consumeOne } = createConsumeHelpers({
      socket,
      device,
      recvTransport,
    });
    const onAlertProduced = async (producerInfo: ProducerInfo) => {
      const {
        user_id: producerId,
        kind: producerKind,
        is_paused: isPaused,
      } = producerInfo;

      const existingConsumer =
        useMeetingSocketStore.getState().consumers[producerId]?.[producerKind];

      if (isPaused) {
        removeMemberStream(producerId, producerKind);

        if (existingConsumer) {
          await socket.emitWithAck('signaling:ws:pause', {
            consumer_id: existingConsumer.id,
          });
        }
        return;
      }

      if (existingConsumer) {
        await socket.emitWithAck('signaling:ws:resume', {
          consumer_id: existingConsumer.id,
        });

        const stream = new MediaStream([existingConsumer.track]);
        setMemberStream(producerId, producerKind, stream);
      } else {
        try {
          const { consumer, kind, stream } = await consumeOne(producerInfo);

          addConsumer(producerId, kind, consumer);
          setMemberStream(producerId, kind, stream);
        } catch (error) {
          console.error('신규 컨슈머 생성 실패:', error);
        }
      }
    };
    socket.on('room:alert_produced', onAlertProduced);

    return () => {
      socket.off('room:alert_produced', onAlertProduced);
    };
  }, [socket, device, recvTransport]);

  return (
    <main className="flex h-screen w-full flex-col overflow-hidden bg-neutral-900">
      <GlobalAudioPlayer />

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
