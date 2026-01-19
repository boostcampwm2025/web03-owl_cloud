'use client';

import { DUMMY_MEETING_INFO } from '@/app/[meetingId]/dummy';
import Modal from '@/components/common/Modal';
import MeetingLobby from '@/components/meeting/MeetingLobby';
import MeetingRoom from '@/components/meeting/MeetingRoom';
import { useMeetingSocket } from '@/hooks/useMeetingSocket';
import { useMeetingSocketStore } from '@/store/useMeetingSocketStore';
import { useMeetingStore } from '@/store/useMeetingStore';
import { createProduceHelper } from '@/utils/createProduceHelpers';
import { initMediasoupTransports } from '@/utils/initMediasoupTransports';
import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

interface JoinError {
  title: string;
  message: string;
}

export default function MeetingPage() {
  const { socket } = useMeetingSocket();
  const { setMediasoupTransports, setProducer } = useMeetingSocketStore();

  // 이후 실제 회의 정보 API 호출로 수정 필요
  const { password } = DUMMY_MEETING_INFO;

  const params = useParams<{ meetingId: string }>();
  const meetingId = params.meetingId;

  const passwordRef = useRef<HTMLInputElement>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [joinError, setJoinError] = useState<JoinError | null>(null);
  const [isJoined, setIsJoined] = useState<boolean>(false);

  const [nickname, setNickname] = useState('');
  const onJoin = (nickname: string) => {
    setNickname(nickname);
    validateJoin();
  };

  // 회의실 비밀번호 유무로 분기 처리
  const validateJoin = () => {
    if (password) {
      setIsPasswordModalOpen(true);
    } else {
      handleJoin();
    }
  };

  // 비밀번호 입력
  const onPasswordConfirm = () => {
    const value = passwordRef.current?.value;
    if (!value) {
      setJoinError({ title: '입장 실패', message: '비밀번호를 입력해주세요' });
      return;
    }

    handleJoin(value);
  };

  // 회의실 참여 로직
  const handleJoin = (password?: string) => {
    if (!socket) return;

    socket.emitWithAck('signaling:ws:join_room', {
      code: meetingId,
      password,
      nickname,
    });
  };

  useEffect(() => {
    if (!socket) return;

    const onRoomJoined = async ({ ok }: { ok: boolean }) => {
      if (ok) {
        // SDP / ICE / DTLS 초기화 진행
        const transports = await initMediasoupTransports(socket);
        setMediasoupTransports(socket, transports);

        // Produce 설정
        const { sendTransport } = transports;
        const producers = createProduceHelper(sendTransport);

        // 초기 입장 시, 로비에서 설정한 미디어 Produce
        const { produceMic, produceCam } = producers;
        const { audioOn, videoOn } = useMeetingStore.getState().media;
        if (audioOn || videoOn) {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: audioOn,
            video: videoOn,
          });
          if (audioOn) {
            const audioTrack = stream.getAudioTracks()[0];
            const audioProducer = await produceMic(audioTrack);
            setProducer('audioProducer', audioProducer);
          }
          if (videoOn) {
            const videoTrack = stream.getVideoTracks()[0];
            const videoProducer = await produceCam(videoTrack);
            setProducer('videoProducer', videoProducer);
          }
        }

        // 회의실로 이동
        setIsPasswordModalOpen(false);
        setIsJoined(true);
      } else {
        setJoinError({ title: '입장 실패', message: 'response로 수정 필요' });
      }
    };
    socket.on('room:joined', onRoomJoined);

    return () => {
      socket.off('room:joined', onRoomJoined);
    };
  }, [socket]);

  if (!meetingId) {
    return <div>잘못된 회의 접근입니다. 다시 시도해주세요.</div>;
  }

  return (
    <main className="min-h-screen">
      {!isJoined ? (
        <>
          <MeetingLobby meetingId={meetingId} onJoin={onJoin} />
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
              />
            </Modal>
          )}
          {joinError && (
            <Modal
              title={joinError.title}
              cancelText="확인"
              onCancel={() => {
                setJoinError(null);
                setIsPasswordModalOpen(true);
              }}
              isLightMode
            >
              비밀번호를 확인해주세요
            </Modal>
          )}
        </>
      ) : (
        <MeetingRoom meetingId={meetingId} />
      )}
    </main>
  );
}
