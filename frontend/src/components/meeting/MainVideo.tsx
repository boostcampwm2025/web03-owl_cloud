import MyVideo from '@/components/meeting/MyVideo';
import MemberVideo from '@/components/meeting/MemberVideo';
import { useMeetingStore } from '@/store/useMeetingStore';

export default function MainVideo() {
  // 화면에 표시될 사람의 id 계산
  const mainDisplayUserId = useMeetingStore((state) => {
    // 1. 고정한 사람 중 첫 번째
    const firstPinnedId = state.pinnedMemberIds[0];
    if (firstPinnedId && state.members[firstPinnedId]) return firstPinnedId;
    // 2. 가장 최근에 발언한 사람
    if (state.lastSpeakerId && state.members[state.lastSpeakerId]) {
      return state.lastSpeakerId;
    }
    // 3. 목록의 첫 번째 유저
    const firstOrderedId = state.orderedMemberIds[0];
    if (firstOrderedId && state.members[firstOrderedId]) return firstOrderedId;

    return -1;
  });

  const memberInfo = useMeetingStore(
    (state) => state.members[mainDisplayUserId],
  );

  return (
    <section className="flex-center h-full w-full overflow-hidden px-4 py-2">
      <div className="flex-center aspect-video h-full w-auto max-w-full">
        {mainDisplayUserId === -1 ? (
          <MyVideo width="100%" />
        ) : (
          <MemberVideo {...memberInfo} width="100%" />
        )}
      </div>
    </section>
  );
}
