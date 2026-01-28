import Modal from '@/components/common/Modal';
import Button from '../common/button';
import Header from '@/components/layout/Header';
import MediaSettingSection from '@/components/meeting/media/MediaSettingSection';
import { useMeetingSocketStore } from '@/store/useMeetingSocketStore';
import { useUserStore } from '@/store/useUserStore';
import { useState } from 'react';
import { useMeetingStore } from '@/store/useMeetingStore';

export default function MeetingLobby({
  onJoin,
}: {
  onJoin: (nickname: string) => void;
}) {
  const { socket } = useMeetingSocketStore();
  const { meetingInfo, isInfoLoaded } = useMeetingStore();
  const { isLoaded, isLoggedIn, nickname } = useUserStore();
  const [tempNickname, setTempNickname] = useState('');
  const isJoinDisabled =
    !socket || !isLoaded || (!isLoggedIn && !tempNickname.trim());

  // 비회원 닉네임 확인 로직
  const [isNicknameError, setIsNicknameError] = useState(false);

  if (!isInfoLoaded) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        회의실 정보를 불러오는 중입니다 ...
      </main>
    );
  }

  const onButtonClick = () => {
    if (isLoggedIn) {
      onJoin(nickname);
    } else {
      if (
        tempNickname.trim() &&
        tempNickname.length >= 1 &&
        tempNickname.length <= 16
      ) {
        onJoin(tempNickname);
      } else {
        setIsNicknameError(true);
      }
    }
  };

  return (
    <main className="flex min-h-screen items-center gap-20 px-6 max-lg:flex-col-reverse max-lg:justify-end max-lg:gap-12 max-lg:pt-32 max-lg:pb-8 lg:justify-center lg:pt-16">
      <Header />

      {/* 영상, 마이크 설정 부분 */}
      <MediaSettingSection />

      <div className="h-px w-full max-w-160 bg-neutral-200 px-6 lg:hidden" />

      {/* 회의 참여 부분 */}
      <section className="flex min-w-60 flex-col items-center justify-center gap-6">
        {isInfoLoaded && (
          <>
            <div className="flex w-full flex-col items-center gap-3">
              <h1 className="text-2xl text-neutral-900">{meetingInfo.title}</h1>
              <div className="flex flex-col items-center gap-1">
                <span className="text-sm text-neutral-600">
                  호스트: {meetingInfo.host_nickname}
                </span>
                <span className="text-sm text-neutral-600">
                  {`현재 참여자: ${meetingInfo.current_participants} / ${meetingInfo.max_participants}명`}
                </span>
              </div>
            </div>

            {isLoaded && !isLoggedIn && (
              <input
                value={tempNickname}
                onChange={(e) => setTempNickname(e.target.value)}
                className="input-default input-light"
                placeholder="닉네임을 입력해주세요"
                autoFocus
              />
            )}

            <Button
              onClick={onButtonClick}
              color={isJoinDisabled ? 'disabled' : 'primary'}
              disabled={isJoinDisabled}
            >
              {socket ? '회의 참여하기' : '연결 준비 중...'}
            </Button>
          </>
        )}
      </section>

      {isNicknameError && (
        <Modal
          title="입장 실패"
          cancelText="확인"
          onCancel={() => setIsNicknameError(false)}
          isLightMode
        >
          닉네임은 1자 이상, 16자 이하로 입력해주세요.
        </Modal>
      )}
    </main>
  );
}
