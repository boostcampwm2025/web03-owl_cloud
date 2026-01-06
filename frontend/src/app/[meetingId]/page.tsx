'use client';

import MeetingLobby from '@/components/meeting/MeetingLobby';
import MeetingRoom from '@/components/meeting/MeetingRoom';
import { useParams } from 'next/navigation';
import { useState } from 'react';

export default function MeetingPage() {
  const params = useParams<{ meetingId: string }>();
  const meetingId = params.meetingId;

  const [isJoined, setIsJoined] = useState<boolean>(false);

  if (!meetingId) {
    return <div>잘못된 회의 접근입니다. 다시 시도해주세요.</div>;
  }

  // 참여 버튼을 눌렀을 때의 핸들러
  const handleJoin = () => {
    setIsJoined(true);
  };

  return (
    <main className="min-h-screen">
      {!isJoined ? (
        <MeetingLobby meetingId={meetingId} onJoin={handleJoin} />
      ) : (
        <MeetingRoom meetingId={meetingId} />
      )}
    </main>
  );
}
