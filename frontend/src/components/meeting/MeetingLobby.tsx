import Modal from '@/components/common/Modal';
import Button from '../common/button';
import Header from '@/components/layout/Header';
import MediaSettingSection from '@/components/meeting/media/MediaSettingSection';
import { useMeetingSocketStore } from '@/store/useMeetingSocketStore';
import { useUserStore } from '@/store/useUserStore';
import { useState } from 'react';

export default function MeetingLobby({
  meetingId,
  onJoin,
}: {
  meetingId: string;
  onJoin: (nickname: string) => void;
}) {
  const meetingLeader = 'Tony';
  const meetingMemberCnt = 9;

  const { socket } = useMeetingSocketStore();
  const { isLoaded, isLoggedIn, nickname } = useUserStore();
  const [tempNickname, setTempNickname] = useState('');
  const isJoinDisabled =
    !socket || !isLoaded || (!isLoggedIn && !tempNickname.trim());

  // 비회원 닉네임 확인 로직
  const [isNicknameError, setIsNicknameError] = useState(false);
  const onButtonClick = () => {
    if (isLoggedIn) {
      onJoin(nickname);
    } else {
      if (tempNickname.trim()) {
        onJoin(tempNickname);
      } else {
        setIsNicknameError(true);
      }
    }
  };

  return (
    <main className="box-border flex min-h-screen items-center justify-center gap-20 px-6 py-4">
      <Header />

      {/* 영상, 마이크 설정 부분 */}
      <MediaSettingSection />

      {/* 회의 참여 부분 */}
      <section className="flex w-full max-w-60 flex-col items-center justify-center gap-6">
        <div className="flex w-full flex-col items-center">
          <h1 className="mb-2 text-2xl text-neutral-900">
            <b>{meetingLeader}</b> 님의 회의실
          </h1>
          <span className="text-base text-neutral-600">
            현재 참여자: {meetingMemberCnt}명
          </span>
        </div>

        {isLoaded && !isLoggedIn && (
          <input
            value={tempNickname}
            onChange={(e) => setTempNickname(e.target.value)}
            className="input-default input-light"
            placeholder="닉네임을 입력해주세요"
          />
        )}

        <Button
          onClick={onButtonClick}
          color={isJoinDisabled ? 'disabled' : 'primary'}
          disabled={isJoinDisabled}
        >
          {socket ? '회의 참여하기' : '연결 준비 중...'}
        </Button>
      </section>

      {isNicknameError && (
        <Modal
          title="입장 실패"
          cancelText="확인"
          onCancel={() => setIsNicknameError(false)}
          isLightMode
        >
          닉네임을 입력해주세요
        </Modal>
      )}
    </main>
  );
}
