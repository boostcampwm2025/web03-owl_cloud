'use client';

import {
  CamOffIcon,
  CamOnIcon,
  ChatIcon,
  CodeIcon,
  ExitMeetingIcon,
  InfoIcon,
  MarkedChatIcon,
  MemberIcon,
  MicOffIcon,
  MicOnIcon,
  ShareIcon,
  WhiteboardIcon,
} from '@/assets/icons/meeting';
import Modal from '@/components/common/Modal';
import MeetingButton from '@/components/meeting/MeetingButton';
import { useCodeEditorSocket } from '@/hooks/useCodeEditorSocket';
import { useProduce } from '@/hooks/useProduce';
import { useMeetingStore } from '@/store/useMeetingStore';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useWhiteboardSocket } from '@/hooks/useWhiteboardSocket';

export default function MeetingMenu() {
  const {
    media,
    members,
    hasNewChat,
    setHasNewChat,
    isInfoOpen,
    isChatOpen,
    isMemberOpen,
    isWhiteboardOpen,
    isCodeEditorOpen,
    setIsOpen,
    screenSharer,
  } = useMeetingStore();
  const screenShareOn = useMeetingStore((state) => state.media.screenShareOn);

  const {
    startAudioProduce,
    stopAudioProduce,
    startVideoProduce,
    stopVideoProduce,
    startScreenProduce,
    stopScreenProduce,
  } = useProduce();

  const { openCodeEditor, closeCodeEditor } = useCodeEditorSocket();

  // 화이트보드 연결 / 해제 함수 가져오기
  const { openWhiteboard, closeWhiteboard } = useWhiteboardSocket();

  const isSomeoneSharing = screenSharer !== null;
  const isDisabledSharing = isSomeoneSharing && !screenShareOn;

  const [error, setError] = useState<{ title: string; message: string } | null>(
    null,
  );

  const toggleAudio = async () => {
    const { audioOn } = useMeetingStore.getState().media;
    if (audioOn) {
      stopAudioProduce();
    } else {
      await startAudioProduce();
    }
  };

  const toggleVideo = async () => {
    const { videoOn } = useMeetingStore.getState().media;
    if (videoOn) {
      stopVideoProduce();
    } else {
      await startVideoProduce();
    }
  };

  const onInfoClick = () => {
    setIsOpen('isInfoOpen', !isInfoOpen);
  };

  const onMemberClick = () => {
    setIsOpen('isMemberOpen', !isMemberOpen);
  };

  const onChatClick = () => {
    setHasNewChat(false);
    setIsOpen('isChatOpen', !isChatOpen);
  };

  const onScreenShareClick = async () => {
    if (isWhiteboardOpen || isCodeEditorOpen) {
      setError({
        title: '화면 공유 실패',
        message:
          '화이트보드 또는 코드 에디터 사용 중에는\n화면 공유가 불가합니다.',
      });
      return;
    }

    if (screenShareOn) {
      stopScreenProduce();
    } else {
      if (isSomeoneSharing) return;
      await startScreenProduce();
    }
  };

  // 화이트보드 버튼 클릭 핸들러
  const onWhiteboardClick = () => {
    if (isWhiteboardOpen) {
      // 이미 열려있으면 -> 연결 끊고 닫기
      closeWhiteboard();
    } else {
      // 닫혀있으면 -> 연결 시도
      openWhiteboard();
    }
    setIsOpen('isWhiteboardOpen', !isWhiteboardOpen);
  };

  const onCodeEditorClick = () => {
    if (isCodeEditorOpen) {
      closeCodeEditor();
      return;
    }
    openCodeEditor();
  };

  const router = useRouter();
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const toggleExitModal = () => setIsExitModalOpen((prev) => !prev);
  const onExit = () => router.replace('/');

  return (
    <nav className="flex w-full justify-between px-4 py-2">
      {/* 미디어 관련 메뉴 */}
      <section className="flex gap-2">
        <MeetingButton
          icon={
            media.audioOn ? (
              <MicOnIcon className="h-8 w-8" />
            ) : (
              <MicOffIcon className="h-8 w-8" />
            )
          }
          text="오디오"
          onClick={toggleAudio}
        />
        <MeetingButton
          icon={
            media.videoOn ? (
              <CamOnIcon className="h-8 w-8" />
            ) : (
              <CamOffIcon className="h-8 w-8" />
            )
          }
          text="비디오"
          onClick={toggleVideo}
        />
      </section>

      {/* 미팅 관련 메뉴 */}
      <section className="flex gap-2">
        <MeetingButton
          icon={<InfoIcon className="h-8 w-8" />}
          text="회의 정보"
          onClick={onInfoClick}
        />
        <div className="relative">
          <MeetingButton
            icon={<MemberIcon className="h-8 w-8" />}
            text="참가자"
            onClick={onMemberClick}
          />
          <span className="absolute top-0.5 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-neutral-600 text-xs font-bold text-neutral-50">
            {Object.values(members).length + 1}
          </span>
        </div>
        <MeetingButton
          icon={
            hasNewChat ? (
              <MarkedChatIcon className="h-8 w-8" />
            ) : (
              <ChatIcon className="h-8 w-8" />
            )
          }
          text="채팅"
          onClick={onChatClick}
        />
        <MeetingButton
          icon={<ShareIcon className="h-8 w-8" />}
          text={
            screenShareOn
              ? '공유 중지'
              : isDisabledSharing
                ? '화면 공유 중'
                : '화면 공유'
          }
          isActive={screenShareOn}
          onClick={onScreenShareClick}
          disabled={isDisabledSharing}
        />
        {/* 화이트보드 버튼 */}
        <MeetingButton
          icon={<WhiteboardIcon className="h-8 w-8" />}
          text="화이트보드"
          isActive={isWhiteboardOpen}
          onClick={onWhiteboardClick}
        />
        <MeetingButton
          icon={<CodeIcon className="h-8 w-8" />}
          text="코드 에디터"
          isActive={isCodeEditorOpen}
          onClick={onCodeEditorClick}
        />
      </section>

      <MeetingButton
        icon={<ExitMeetingIcon className="h-8 w-8" />}
        text="나가기"
        onClick={toggleExitModal}
      />
      {isExitModalOpen && (
        <Modal
          title="회의 나가기"
          cancelText="취소"
          onCancel={toggleExitModal}
          confirmText="나가기"
          onConfirm={onExit}
          isWarning
        >
          회의를 나갈까요?
        </Modal>
      )}

      {error && (
        <Modal
          title={error.title}
          cancelText="확인"
          onCancel={() => setError(null)}
        >
          {error.message}
        </Modal>
      )}
    </nav>
  );
}
