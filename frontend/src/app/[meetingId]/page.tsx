'use client';

import Modal from '@/components/common/Modal';
import MeetingLobby from '@/components/meeting/MeetingLobby';
import MeetingRoom from '@/components/meeting/MeetingRoom';
import { useMeetingSocket } from '@/hooks/useMeetingSocket';
import { useMeetingSocketStore } from '@/store/useMeetingSocketStore';
import { useMeetingStore } from '@/store/useMeetingStore';
import { useUserStore } from '@/store/useUserStore';
import { MeetingInfoResponse } from '@/types/meeting';
import { api } from '@/utils/apiClient';
import { initMediasoupTransports } from '@/utils/initMediasoupTransports';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

interface JoinError {
  title: string;
  message: string;
  isPasswordError?: boolean;
}

export default function MeetingPage() {
  const { socket } = useMeetingSocket();
  const { setMediasoupTransports } = useMeetingSocketStore();
  const { isLoggedIn, setTempUser } = useUserStore();
  const { meetingInfo, setMeetingInfo } = useMeetingStore();

  const { meetingId } = useParams<{ meetingId: string }>();

  const passwordRef = useRef<HTMLInputElement>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [joinError, setJoinError] = useState<JoinError | null>(null);
  const [isJoined, setIsJoined] = useState<boolean>(false);

  const router = useRouter();

  useEffect(() => {
    setMeetingInfo({ meetingId });
  }, [meetingId]);

  const onJoin = (nickname: string) => {
    setTempUser({ nickname });
    validateJoin();
  };

  // 회의실 비밀번호 유무로 분기 처리
  const validateJoin = () => {
    if (meetingInfo?.has_password) {
      setIsPasswordModalOpen(true);
    } else {
      handleJoin();
    }
  };

  // 비밀번호 입력
  const onPasswordConfirm = () => {
    const value = passwordRef.current?.value;
    if (!value) {
      setJoinError({
        title: '입장 실패',
        message: '비밀번호를 입력해주세요',
        isPasswordError: true,
      });
      return;
    }

    handleJoin(value);
  };

  // 회의실 참여 로직
  const handleJoin = async (password?: string) => {
    if (!socket) return;

    // 회의실 참여
    const currentNickname = useUserStore.getState().nickname;
    socket.emitWithAck('signaling:ws:join_room', {
      code: meetingId,
      password,
      nickname: currentNickname,
    });
  };

  useEffect(() => {
    if (!socket) return;

    const onRoomJoined = async ({
      ok,
      user_id,
      is_hosted,
    }: {
      ok: boolean;
      user_id: string;
      is_hosted: boolean;
    }) => {
      if (ok) {
        // 비회원인 경우 임시 id 저장
        if (!isLoggedIn) setTempUser({ userId: user_id });

        // SDP / ICE / DTLS 초기화 진행
        const transports = await initMediasoupTransports(socket);
        setMediasoupTransports(socket, transports);
        setMeetingInfo({ isHosted: is_hosted });

        // 회의실로 이동
        setIsPasswordModalOpen(false);
        setIsJoined(true);
      } else {
        setJoinError({
          title: '입장 실패',
          message: '연결에 실패했습니다. 다시 시도해주세요.',
        });
      }
    };
    socket.on('room:joined', onRoomJoined);

    const onException = async ({ message }: { message: string }) => {
      setJoinError({ title: '입장 실패', message });
    };
    socket.on('exception', onException);

    return () => {
      socket.off('room:joined', onRoomJoined);
      socket.off('exception', onException);
    };
  }, [socket]);

  useEffect(() => {
    const getMeetingInfo = async () => {
      try {
        const meetingInfo = await api.get<MeetingInfoResponse>(
          `/rooms/${meetingId}`,
        );
        setMeetingInfo(meetingInfo);
      } catch (err: unknown) {
        const params = new URLSearchParams({
          title: '존재하지 않는 회의실입니다',
          status: '409',
          message:
            err instanceof Error ? err.message : '회의 코드를 확인해주세요',
        });
        router.replace(`/error?${params.toString()}`);
      }
    };

    getMeetingInfo();
  }, []);

  if (!meetingId) {
    return <div>잘못된 회의 접근입니다. 다시 시도해주세요.</div>;
  }

  return (
    <main className="min-h-screen">
      {!isJoined ? (
        <>
          <MeetingLobby onJoin={onJoin} />
          {!joinError && isPasswordModalOpen && (
            <Modal
              title="비밀번호 입력"
              cancelText="취소"
              onCancel={() => setIsPasswordModalOpen(false)}
              confirmText="확인"
              onConfirm={onPasswordConfirm}
              isLightMode
            >
              <input
                ref={passwordRef}
                className="input-sm input-light"
                type="password"
                autoFocus
              />
            </Modal>
          )}
          {joinError && (
            <Modal
              title={joinError.title}
              cancelText="확인"
              onCancel={() => {
                setJoinError(null);
                if (joinError.isPasswordError) setIsPasswordModalOpen(true);
              }}
              isLightMode
            >
              {joinError.message}
            </Modal>
          )}
        </>
      ) : (
        <MeetingRoom />
      )}
    </main>
  );
}
