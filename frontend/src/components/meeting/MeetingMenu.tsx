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
  MoreMenuIcon,
  ShareIcon,
  WhiteboardIcon,
} from '@/assets/icons/meeting';
import Modal from '@/components/common/Modal';
import MeetingButton from '@/components/meeting/MeetingButton';
import { useCodeEditorSocket } from '@/hooks/useCodeEditorSocket';
import { useProduce } from '@/hooks/useProduce';
import { useMeetingStore } from '@/store/useMeetingStore';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { useWhiteboardSocket } from '@/hooks/useWhiteboardSocket';
import { useWindowSize } from '@/hooks/useWindowSize';
import { useChatStore } from '@/store/useChatStore';
import { useClickOutside } from '@/hooks/useClickOutside';
import { useMeetingSocketStore } from '@/store/useMeetingSocketStore';

export default function MeetingMenu() {
  const { width } = useWindowSize();
  const BREAK_POINT = 880;

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
    isCodeEditorOpening,
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
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const toggleAudio = async () => {
    const { audioOn } = useMeetingStore.getState().media;
    if (audioOn) {
      stopAudioProduce();
    } else {
      try {
        await startAudioProduce();
      } catch (error) {
        if (error instanceof Error && error.message === 'PERMISSION_DENIED') {
          setError({
            title: '마이크 권한 필요',
            message:
              '브라우저 설정에서 마이크 권한을 허용해 주세요.\n(주소창 왼쪽 자물쇠 아이콘 클릭)',
          });
        }
      }
    }
  };

  const toggleVideo = async () => {
    const { videoOn } = useMeetingStore.getState().media;
    if (videoOn) {
      stopVideoProduce();
    } else {
      try {
        await startVideoProduce();
      } catch (error) {
        if (error instanceof Error && error.message === 'PERMISSION_DENIED') {
          setError({
            title: '카메라 권한 필요',
            message:
              '브라우저 설정에서 카메라 권한을 허용해 주세요.\n(주소창 왼쪽 자물쇠 아이콘 클릭)',
          });
        }
      }
    }
  };

  const onInfoClick = () => {
    setIsOpen('isInfoOpen', !isInfoOpen);
    if (isMoreMenuOpen) setIsMoreMenuOpen(false);
  };

  const onMemberClick = () => {
    setIsOpen('isMemberOpen', !isMemberOpen);
    if (isMoreMenuOpen) setIsMoreMenuOpen(false);
  };

  const onChatClick = () => {
    setHasNewChat(false);
    setIsOpen('isChatOpen', !isChatOpen);
    if (isMoreMenuOpen) setIsMoreMenuOpen(false);
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

    if (isMoreMenuOpen) setIsMoreMenuOpen(false);
  };

  // 화이트보드 버튼 클릭 핸들러
  const onWhiteboardClick = () => {
    if (screenShareOn || screenSharer || isCodeEditorOpen) {
      setError({
        title: '화이트보드 실행 실패',
        message:
          '화면 공유 또는 코드 에디터 사용 중에는\n화이트보드 실행이 불가합니다.',
      });
      return;
    }

    if (isWhiteboardOpen) {
      // 이미 열려있으면 -> 연결 끊고 닫기
      setIsExitModalOpen({
        title: '화이트보드 종료',
        message:
          '화이트보드를 종료할까요?\n다른 사용자의 화이트보드도 함께 종료돼요.',
        confirmText: '종료',
        onConfirm: closeWhiteboard,
      });
    } else {
      // 닫혀있으면 -> 연결 시도
      openWhiteboard();
    }
    // setIsOpen('isWhiteboardOpen', !isWhiteboardOpen);
    if (isMoreMenuOpen) setIsMoreMenuOpen(false);
  };

  const onCodeEditorClick = () => {
    if (screenShareOn || screenSharer || isWhiteboardOpen) {
      setError({
        title: '코드 에디터 실행 실패',
        message:
          '화면 공유 또는 화이트보드 사용 중에는\n코드 에디터 실행이 불가합니다.',
      });
      return;
    }

    if (isCodeEditorOpening) return;

    if (isCodeEditorOpen) {
      setIsExitModalOpen({
        title: '코드 에디터 종료',
        message:
          '코드 에디터를 종료할까요?\n다른 사용자의 코드 에디터도 함께 종료돼요.',
        confirmText: '종료',
        onConfirm: closeCodeEditor,
      });
    } else {
      openCodeEditor();
    }

    // setIsOpen('isCodeEditorOpen', !isCodeEditorOpen);
    if (isMoreMenuOpen) setIsMoreMenuOpen(false);
  };

  const onMoreMenuClick = () => {
    setIsMoreMenuOpen((prev) => !prev);
  };

  const router = useRouter();
  const [isExitModalOpen, setIsExitModalOpen] = useState<{
    title: string;
    message: string;
    confirmText: string;
    onConfirm: () => void;
  } | null>(null);
  const onExit = () => {
    useChatStore.getState().reset();
    window.location.href = '/';
  };

  const MENU_ITEMS = [
    {
      id: 'info',
      icon: <InfoIcon className="h-8 w-8" />,
      text: '회의 정보',
      onClick: onInfoClick,
      isActive: isInfoOpen,
    },
    {
      id: 'member',
      icon: <MemberIcon className="h-8 w-8" />,
      text: '참가자',
      onClick: onMemberClick,
      isActive: isMemberOpen,
      badge: Object.values(members).length + 1,
    },
    {
      id: 'chat',
      icon: hasNewChat ? (
        <MarkedChatIcon className="h-8 w-8" />
      ) : (
        <ChatIcon className="h-8 w-8" />
      ),
      text: '채팅',
      onClick: onChatClick,
      isActive: isChatOpen,
    },
    {
      id: 'screenShare',
      icon: <ShareIcon className="h-8 w-8" />,
      text: screenShareOn
        ? '공유 중지'
        : isDisabledSharing
          ? '화면 공유 중'
          : '화면 공유',
      onClick: onScreenShareClick,
      isActive: screenShareOn,
      disabled: isDisabledSharing,
    },
    {
      id: 'whiteboard',
      icon: <WhiteboardIcon className="h-8 w-8" />,
      text: '화이트보드',
      onClick: onWhiteboardClick,
      isActive: isWhiteboardOpen,
    },
    {
      id: 'codeEditor',
      icon: <CodeIcon className="h-8 w-8" />,
      text: '코드 에디터',
      onClick: onCodeEditorClick,
      isActive: isCodeEditorOpen,
    },
  ];

  const moreMenuBtnRef = useRef<HTMLDivElement>(null);
  useClickOutside(
    moreMenuBtnRef,
    () => setIsMoreMenuOpen(false),
    isMoreMenuOpen,
  );

  return (
    <nav className="flex w-full justify-between px-4 py-2">
      {/* 미디어 관련 메뉴 */}
      <section className="flex w-full max-w-44 gap-2">
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
      {width > BREAK_POINT && (
        <section className="flex w-full justify-center gap-2">
          {MENU_ITEMS.map((item) => (
            <div key={item.id} className="relative w-full max-w-22">
              <MeetingButton
                icon={item.icon}
                text={item.text}
                onClick={item.onClick}
                isActive={item.isActive}
                disabled={item.disabled}
              />
              {item.badge && (
                <span className="absolute top-0.5 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-neutral-600 text-xs font-bold text-neutral-50">
                  {item.badge}
                </span>
              )}
            </div>
          ))}
        </section>
      )}

      <section
        className={`flex w-full gap-2 ${width <= BREAK_POINT ? 'max-w-44' : 'max-w-22'}`}
      >
        {width <= BREAK_POINT && (
          <div ref={moreMenuBtnRef} className="relative w-full">
            <MeetingButton
              icon={<MoreMenuIcon className="h-8 w-8" />}
              text="더보기"
              onClick={onMoreMenuClick}
            />
            {isMoreMenuOpen && (
              <menu className="absolute right-0 bottom-[calc(100%+8px)] z-100 w-40 rounded-sm border border-neutral-500 bg-neutral-600">
                {MENU_ITEMS.map((item) => (
                  <button
                    key={item.id}
                    className={`dropdown-btn ${item.disabled ? 'cursor-not-allowed opacity-50' : ''}`}
                    onClick={item.onClick}
                    disabled={item.disabled}
                  >
                    {item.text}
                  </button>
                ))}
              </menu>
            )}
          </div>
        )}
        <MeetingButton
          icon={<ExitMeetingIcon className="h-8 w-8" />}
          text="나가기"
          onClick={() =>
            setIsExitModalOpen({
              title: '회의 나가기',
              message: '회의를 나갈까요?',
              confirmText: '나가기',
              onConfirm: onExit,
            })
          }
        />
      </section>
      {isExitModalOpen && (
        <Modal
          title={isExitModalOpen.title}
          cancelText="취소"
          onCancel={() => setIsExitModalOpen(null)}
          confirmText={isExitModalOpen.confirmText}
          onConfirm={() => {
            isExitModalOpen.onConfirm();
            setIsExitModalOpen(null);
          }}
          isWarning
        >
          {isExitModalOpen.message}
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
