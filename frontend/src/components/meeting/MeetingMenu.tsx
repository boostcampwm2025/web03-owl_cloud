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
  WorkspaceIcon,
} from '@/assets/icons/meeting';
import Modal from '@/components/common/Modal';
import MeetingButton from '@/components/meeting/MeetingButton';
import { useMeeingStore } from '@/store/useMeetingStore';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function MeetingMenu() {
  const {
    audio,
    setAudio,
    video,
    setVideo,
    members,
    hasNewChat,
    setHasNewChat,
    isInfoOpen,
    isChatOpen,
    isMemberOpen,
    isWorkspaceOpen,
    isCodeEditorOpen,
    setIsOpen,
  } = useMeeingStore();

  const toggleAudio = () => setAudio(audio === 'ON' ? 'OFF' : 'ON');

  const toggleVideo = () => setVideo(video === 'ON' ? 'OFF' : 'ON');

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

  const onWorkspaceClick = () => {
    setIsOpen('isWorkspaceOpen', !isWorkspaceOpen);
  };

  const onCodeEditorClick = () => {
    setIsOpen('isCodeEditorOpen', !isCodeEditorOpen);
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
            audio === 'ON' ? (
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
            video === 'ON' ? (
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
            {members}
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
          text="화면 공유"
        />
        <MeetingButton
          icon={<WorkspaceIcon className="h-8 w-8" />}
          text="워크스페이스"
          isActive={isWorkspaceOpen}
          onClick={onWorkspaceClick}
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
    </nav>
  );
}
