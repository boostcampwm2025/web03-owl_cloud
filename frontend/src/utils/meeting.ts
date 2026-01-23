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
