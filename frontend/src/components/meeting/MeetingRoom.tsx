'use client';

import CodeEditor from '@/components/code-editor/CodeEditor';
import ChatModal from '@/components/meeting/ChatModal';
import { GlobalAudioPlayer } from '@/components/meeting/GlobalAudioPlayer';
import InfoModal from '@/components/meeting/InfoModal';
import MeetingMenu from '@/components/meeting/MeetingMenu';
import MemberModal from '@/components/meeting/MemberModal';
import MemberVideoBar from '@/components/meeting/MemberVideoBar';
import Whiteboard from '@/components/whiteboard/Whiteboard';
import { useWhiteboardSocket } from '@/hooks/useWhiteboardSocket';
import { useCodeEditorSocket } from '@/hooks/useCodeEditorSocket';
import { useMeetingSocket } from '@/hooks/useMeetingSocket';
import { useProduce } from '@/hooks/useProduce';
import { useMeetingSocketStore } from '@/store/useMeetingSocketStore';
import { useMeetingStore } from '@/store/useMeetingStore';
import { useToolSocketStore } from '@/store/useToolSocketStore';
import { useUserStore } from '@/store/useUserStore';
import {
  FetchRoomMembersResponse,
  MeetingMemberInfo,
  ProducerInfo,
  ProviderInfo,
  ProviderToolInfo,
} from '@/types/meeting';
import { createConsumeHelpers } from '@/utils/createConsumeHelpers';
import { useEffect } from 'react';
import VideoView from './media/VideoView';
import AudioView from '@/components/meeting/media/AudioView';
import MainVideo from '@/components/meeting/MainVideo';

export default function MeetingRoom({ meetingId }: { meetingId: string }) {
  const {
    media,
    isInfoOpen,
    isMemberOpen,
    isChatOpen,
    isWhiteboardOpen,
    isCodeEditorOpen,
    screenSharer,
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
    setIsOpen,
    setScreenSharer,
  } = useMeetingStore();
  const { userId } = useUserStore();

  const { joinCodeEditor } = useCodeEditorSocket();
  const { joinWhiteboard } = useWhiteboardSocket();
  const { socket: mainSocket } = useMeetingSocket();
  const { codeEditorSocket, whiteboardSocket } = useToolSocketStore();

  const screenVideoStream = useMeetingStore((state) =>
    screenSharer ? state.memberStreams[screenSharer.id]?.screen_video : null,
  );
  const screenAudioStream = useMeetingStore((state) =>
    screenSharer ? state.memberStreams[screenSharer.id]?.screen_audio : null,
  );

  useEffect(() => {
    if (!codeEditorSocket) {
      setIsOpen('isCodeEditorOpen', false);
    }
  }, [codeEditorSocket]);

  useEffect(() => {
    if (!whiteboardSocket) {
      setIsOpen('isWhiteboardOpen', false);
    }
  }, [whiteboardSocket]);

  // 툴 소켓 연결 전파
  useEffect(() => {
    if (!mainSocket) return;

    const handleRequestCodeEditor = ({
      request_user,
      tool,
    }: {
      request_user: string;
      tool: string;
    }) => {
      // 이미 에디터가 열려있는 상태가 아닐 때만 참여
      if (!isCodeEditorOpen) {
        joinCodeEditor(tool);
      }
    };

    const handleRequestWhiteboard = ({
      request_user,
      tool,
    }: {
      request_user: string;
      tool: string;
    }) => {
      joinWhiteboard(tool);
    };

    mainSocket.on('room:request_codeeditor', handleRequestCodeEditor);
    mainSocket.on('room:request_whiteboard', handleRequestWhiteboard);

    return () => {
      mainSocket.off('room:request_codeeditor', handleRequestCodeEditor);
      mainSocket.off('room:request_whiteboard', handleRequestWhiteboard);
    };
  }, [
    mainSocket,
    isCodeEditorOpen,
    isWhiteboardOpen,
    joinCodeEditor,
    joinWhiteboard,
  ]);

  // 초기 입장 시 로비에서 설정한 미디어 Produce
  useEffect(() => {
    if (!isReady || !socket || !userId || !device || !recvTransport) return;

    const { audioOn, videoOn } = media;

    const initRoom = async () => {
      try {
        if (audioOn) await startAudioProduce();
        if (videoOn) await startVideoProduce();

        // 현재 회의에 참여 중인 참가자 정보 저장
        const { main, members } = (await socket.emitWithAck(
          'signaling:ws:room_members',
        )) as FetchRoomMembersResponse;
        const filteredMembers = members.filter(
          (member) => member.user_id !== userId,
        );
        setMembers(filteredMembers);

        if (!main) return;

        const { consumeOne } = createConsumeHelpers({
          socket,
          device,
          recvTransport,
        });

        const checkAndConsumeScreen = async (
          info: ProviderInfo | ProviderToolInfo | null,
        ) => {
          if (!info) return;

          // 화면공유 상태면
          if (
            'type' in info &&
            (info.type === 'screen_audio' || info.type === 'screen_video')
          ) {
            setScreenSharer({ id: info.user_id, nickname: info.nickname });

            const screenProducerInfo: ProducerInfo = {
              producer_id: info.provider_id,
              user_id: info.user_id,
              status: 'main', // 화면 공유는 메인
              kind: info.kind,
              type: info.type,
              nickname: info.nickname,
              is_paused: false,
            };

            try {
              const { consumer, stream } = await consumeOne(screenProducerInfo);

              addConsumer(info.provider_id, consumer);
              setMemberStream(info.user_id, info.type, stream);
            } catch (err) {
              console.error('화면 공유 데이터 수신 실패:', err);
            }
          }
        };

        const checkAndJoinTool = (
          info: ProviderInfo | ProviderToolInfo | null,
        ) => {
          if (!info) return;

          // tool 있는지 확인 - 타입 가드
          if ('tool' in info && info.tool) {
            if (info.tool === 'codeeditor' && !isCodeEditorOpen) {
              joinCodeEditor(info.tool);
            } else if (info.tool === 'whiteboard') {
              joinWhiteboard(info.tool);
            }
          }
        };

        checkAndJoinTool(main.main);
        checkAndJoinTool(main.sub);

        await Promise.all([
          checkAndConsumeScreen(main.main),
          checkAndConsumeScreen(main.sub),
        ]);
      } catch (error) {
        console.error('에러 발생:', error);
      }
    };

    initRoom();
  }, [isReady, socket, device, recvTransport]);

  // 입장, 퇴장하는 사용자 처리
  useEffect(() => {
    if (!socket) return;

    const onNewUser = async (userInfo: MeetingMemberInfo) => {
      addMember(userInfo);
    };

    const onUserClosed = async (userId: string) => {
      const currentScreenSharer = useMeetingStore.getState().screenSharer?.id;
      if (currentScreenSharer === userId) setScreenSharer(null);

      removeMember(userId);
      removeConsumer(userId);
    };

    const onScreenStop = ({ main, sub }: { main: boolean; sub: boolean }) => {
      if (main || sub) {
        setScreenSharer(null);
      }
    };

    socket.on('room:new_user', onNewUser);
    socket.on('room:user_closed', onUserClosed);
    socket.on('room:screen_stop', onScreenStop);
    return () => {
      socket.off('room:new_user', onNewUser);
      socket.off('room:user_closed', onUserClosed);
      socket.off('room:screen_stop', onScreenStop);
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
        user_id: userId,
        type: producerType,
        nickname: producerNickname,
        is_paused: isPaused,
        producer_id: producerId,
      } = producerInfo;

      const existingConsumer =
        useMeetingSocketStore.getState().consumers[producerId];

      if (isPaused) {
        removeMemberStream(userId, producerType);

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
        setMemberStream(userId, producerType, stream);
      } else {
        try {
          const { consumer, stream } = await consumeOne(producerInfo);

          addConsumer(producerId, consumer);
          setMemberStream(userId, producerType, stream);

          if (
            producerType === 'screen_video' ||
            producerType === 'screen_audio'
          ) {
            setScreenSharer({ id: userId, nickname: producerNickname });
          }
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
        {/* 화이트보드 / 코드 에디터 등의 컴포넌트가 들어갈 공간 */}
        <div className="flex h-full w-full overflow-hidden">
          {!screenVideoStream && !isWhiteboardOpen && !isCodeEditorOpen && (
            <MainVideo />
          )}

          {screenVideoStream && (
            <div className="group flex-center relative aspect-video w-full rounded-lg bg-neutral-700">
              <div className="flex-center h-full w-full overflow-hidden rounded-lg">
                <VideoView stream={screenVideoStream} mirrored={false} />
                {screenAudioStream && (
                  <AudioView stream={screenAudioStream} userId={userId} />
                )}
                <div className="absolute bottom-6 left-10 rounded-md bg-black/60 px-3 py-1.5 text-sm font-medium text-white">
                  {screenSharer?.nickname}님의 화면
                </div>
              </div>
            </div>
          )}

          {isWhiteboardOpen && (
            <div
              className={isCodeEditorOpen ? 'h-full w-1/2' : 'h-full w-full'}
            >
              <Whiteboard />
            </div>
          )}
          {isCodeEditorOpen && (
            <div
              className={isWhiteboardOpen ? 'h-full w-1/2' : 'h-full w-full'}
            >
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

      {isInfoOpen && <InfoModal meetingId={meetingId} />}
    </main>
  );
}
