import { ConsumerInfo, MeetingMemberInfo } from '@/types/meeting';
import { Consumer, Transport } from 'mediasoup-client/types';

export const getVideoConsumerIds = (
  members: Record<string, MeetingMemberInfo>,
  visibleMembers: MeetingMemberInfo[],
  consumers: Record<string, Consumer>,
) => {
  const allMembers = Object.values(members);
  const visibleIdsSet = new Set(visibleMembers.map((member) => member.user_id));

  const newVideoConsumers: string[] = [];
  const resumeConsumerIds: string[] = [];
  const pauseConsumerIds: string[] = [];

  const visibleStreamTracks: { userId: string; track: MediaStreamTrack }[] = [];
  const hiddenUserIds: string[] = [];

  allMembers.forEach((member) => {
    const producerId = member.cam?.provider_id;
    if (!producerId) return;

    const consumer = consumers[producerId];

    if (visibleIdsSet.has(member.user_id)) {
      // 새로운 consume 대상
      if (!consumer) {
        newVideoConsumers.push(producerId);
      } else {
        // resume 대상 계산
        resumeConsumerIds.push(consumer.id);
        visibleStreamTracks.push({
          userId: member.user_id,
          track: consumer.track,
        });
      }
    } else {
      // pause 대상 계산
      hiddenUserIds.push(member.user_id);
      if (consumer) {
        pauseConsumerIds.push(consumer.id);
      }
    }
  });

  return {
    newVideoConsumers,
    resumeConsumerIds,
    pauseConsumerIds,
    visibleStreamTracks,
    hiddenUserIds,
  };
};

export const getAudioConsumerIds = (
  members: Record<string, MeetingMemberInfo>,
  consumers: Record<string, Consumer>,
) => {
  const allMembers = Object.values(members);
  const newAudioConsumers: string[] = [];

  allMembers.forEach((member) => {
    const micId = member.mic?.provider_id;
    if (!micId) return;

    if (!consumers[micId]) {
      newAudioConsumers.push(micId);
    }
  });

  return { newAudioConsumers };
};

export const getConsumerInstances = async (
  recvTransport: Transport,
  newConsumersData: ConsumerInfo[],
) => {
  const consumerInstances = await Promise.all(
    newConsumersData.map(async (data) => {
      const { consumer_id, producer_id, kind, rtpParameters } = data;
      const consumer = await recvTransport.consume({
        id: consumer_id,
        producerId: producer_id,
        kind,
        rtpParameters,
        appData: {
          type: kind === 'audio' ? 'mic' : kind === 'video' ? 'cam' : undefined,
          status: 'user',
        },
      });

      return {
        producerId: producer_id,
        consumer: consumer,
      };
    }),
  );

  return consumerInstances;
};

export const getMembersPerPage = (width: number) => {
  if (width < 480) return 1;
  if (width < 640) return 2;
  if (width < 800) return 3;
  if (width < 1024) return 4;
  if (width < 1280) return 5;
  return 6;
};

interface ReorderMembersParams {
  orderedIds: string[];
  pinnedIds: string[];
  speakingUserId?: string | null;
  visibleCount: number;
}

export const reorderMembers = ({
  orderedIds,
  pinnedIds,
  speakingUserId,
  visibleCount,
}: ReorderMembersParams) => {
  // pinned는 순서 유지
  const pinnedSet = new Set(pinnedIds);

  // pinned를 제외한 나머지
  const unpinnedIds = orderedIds.filter((id) => !pinnedSet.has(id));

  // 발언자가 없거나, unpinned에 없으면 그대로
  if (!speakingUserId || pinnedSet.has(speakingUserId)) {
    return [...pinnedIds, ...unpinnedIds];
  }

  const speakingIndex = unpinnedIds.indexOf(speakingUserId);

  // 발언자가 이미 첫 페이지에 있으면 reorder 불필요
  const speakingVisibleIndex = pinnedIds.length + speakingIndex;
  if (speakingIndex === -1 || speakingVisibleIndex < visibleCount) {
    return [...pinnedIds, ...unpinnedIds];
  }

  // 발언자를 pinned 뒤 첫 위치로 이동
  const nextUnpinned = [
    speakingUserId,
    ...unpinnedIds.filter((id) => id !== speakingUserId),
  ];

  return [...pinnedIds, ...nextUnpinned];
};
