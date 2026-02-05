'use client';

import { ChevronLeftIcon, ChevronRightIcon } from '@/assets/icons/common';
import MyVideo from '@/components/meeting/MyVideo';
import MemberVideo from '@/components/meeting/MemberVideo';
import { useMeetingSocketStore } from '@/store/useMeetingSocketStore';
import { useMeetingStore } from '@/store/useMeetingStore';
import { ConsumerInfo, ProducerInfo } from '@/types/meeting';
import {
  getConsumerInstances,
  getMembersPerPage,
  getVideoConsumerIds,
} from '@/utils/meeting';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useWindowSize } from '@/hooks/useWindowSize';

export default function MemberVideoBar() {
  const { width } = useWindowSize();

  const membersPerPage = useMemo(() => {
    return getMembersPerPage(width);
  }, [width]);
  const firstPageMemberCount = membersPerPage - 1;

  const {
    members,
    setMemberStream,
    removeMemberStream,
    orderedMemberIds,
    pinnedMemberIds,
    lastSpeakerId,
    moveToFront,
  } = useMeetingStore();

  const { socket, recvTransport, device, addConsumers } =
    useMeetingSocketStore();
  const [currentPage, setCurrentPage] = useState(1);

  // 전체 페이지 수 계산 (첫 페이지는 MyVideo 포함)
  const totalPages = useMemo(() => {
    const memberCount = Object.values(members).length;
    if (memberCount <= firstPageMemberCount) return 1;
    return 1 + Math.ceil((memberCount - firstPageMemberCount) / membersPerPage);
  }, [members, firstPageMemberCount, membersPerPage]);

  if (currentPage > totalPages) {
    setCurrentPage(totalPages);
  }

  const sortedMembers = useMemo(() => {
    return orderedMemberIds.map((id) => members[id]).filter(Boolean);
  }, [orderedMemberIds, members]);

  // 현재 페이지에 보여야 할 멤버 리스트 계산
  const visibleMembers = useMemo(() => {
    const isFirstPage = currentPage === 1;
    const start = isFirstPage
      ? 0
      : (currentPage - 2) * membersPerPage + firstPageMemberCount;
    const end = isFirstPage ? firstPageMemberCount : start + membersPerPage;

    return sortedMembers.slice(start, end);
  }, [sortedMembers, currentPage, firstPageMemberCount, membersPerPage]);

  const mainDisplayMember = useMemo(() => {
    // 고정된 멤버
    const firstPinnedId = pinnedMemberIds[0];
    if (firstPinnedId && members[firstPinnedId]) return members[firstPinnedId];

    // 최근 발언자
    if (lastSpeakerId && members[lastSpeakerId]) {
      return members[lastSpeakerId];
    }

    // 목록의 첫 번째 유저 (보통 visibleMembers에 포함되지만, 페이지 넘기면 아닐 수 있음)
    const firstOrderedId = orderedMemberIds[0];
    if (firstOrderedId && members[firstOrderedId])
      return members[firstOrderedId];

    return null;
  }, [pinnedMemberIds, lastSpeakerId, orderedMemberIds, members]);

  // 실제로 영상을 수신해야(Resume) 할 멤버 합집합 계산
  // (상단 바에 보이는 멤버들 + 메인에 보이는 멤버)
  const targetStreamMembers = useMemo(() => {
    const targets = [...visibleMembers];

    // 메인 멤버가 존재하고, 현재 visible 리스트에 없다면 추가
    if (
      mainDisplayMember &&
      !targets.find((m) => m.user_id === mainDisplayMember.user_id)
    ) {
      targets.push(mainDisplayMember);
    }

    return targets;
  }, [visibleMembers, mainDisplayMember]);

  const hasPrevPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  // visibleMembers가 바뀔 때 consume, resume/pause
  useEffect(() => {
    if (!socket || !recvTransport || !device) return;

    const syncVideoStreams = async () => {
      const currentConsumers = useMeetingSocketStore.getState().consumers;
      const {
        newVideoConsumers,
        resumeConsumerIds,
        pauseConsumerIds,
        visibleStreamTracks,
        hiddenUserIds,
      } = getVideoConsumerIds(members, targetStreamMembers, currentConsumers);

      const allResumeIds = [...resumeConsumerIds];

      // 새로운 consumer 추가
      if (newVideoConsumers.length > 0) {
        const payload = {
          transport_id: recvTransport.id,
          producer_infos: newVideoConsumers.map((id) => ({
            producer_id: id,
            rtpCapabilities: device.rtpCapabilities,
            status: 'user',
          })),
        };

        const { consumerInfos }: { consumerInfos: ConsumerInfo[] } =
          await socket.emitWithAck('signaling:ws:consumes', payload);
        const newConsumers = await getConsumerInstances(
          recvTransport,
          consumerInfos,
        );

        addConsumers(newConsumers);

        newConsumers.forEach(({ producerId, consumer }) => {
          allResumeIds.push(consumer.id);

          const userId = Object.values(members).find(
            (m) => m.cam?.provider_id === producerId,
          )?.user_id;
          if (userId) {
            if (members[userId].cam?.is_paused) {
              removeMemberStream(userId, 'cam');
            } else {
              setMemberStream(userId, 'cam', new MediaStream([consumer.track]));
            }
          }
        });
      }

      // 그룹 resume
      if (allResumeIds.length > 0) {
        socket.emit('signaling:ws:resumes', { consumer_ids: allResumeIds });

        allResumeIds.forEach((consumerId) => {
          const consumer = currentConsumers[consumerId];
          const userId = Object.values(members).find(
            (m) => m.cam?.provider_id === consumerId,
          )?.user_id;

          if (consumer && userId) {
            // 생산자가 진짜로 pause한 상태라면 연결하지 않음
            if (members[userId].cam?.is_paused) {
              removeMemberStream(userId, 'cam');
            } else {
              setMemberStream(userId, 'cam', new MediaStream([consumer.track]));
            }
          }
        });

        // 이미 활성화되어 있던 트랙들도 확실하게 다시 세팅
        visibleStreamTracks.forEach(({ userId, track }) => {
          if (members[userId].cam?.is_paused) removeMemberStream(userId, 'cam');
          else setMemberStream(userId, 'cam', new MediaStream([track]));
        });
      }

      // 그룹 pause
      if (pauseConsumerIds.length > 0) {
        socket.emit('signaling:ws:pauses', { consumer_ids: pauseConsumerIds });
        hiddenUserIds.forEach((userId) => removeMemberStream(userId, 'cam'));
      }
    };

    syncVideoStreams();
  }, [
    targetStreamMembers,
    socket,
    recvTransport,
    device,
    members,
    setMemberStream,
    removeMemberStream,
    addConsumers,
  ]);

  const checkAndMoveToFront = useCallback(
    (userId: string) => {
      // 현재 정렬된 멤버 목록에서 1페이지에 들어가는 멤버들의 ID를 추출
      // (orderedMemberIds는 전체 순서이므로, 0부터 firstPageMemberCount까지가 1페이지 멤버임)
      const firstPageMemberIds = orderedMemberIds.slice(
        0,
        firstPageMemberCount,
      );

      // 이미 1페이지에 존재한다면(포함되어 있다면) 이동하지 않음
      if (firstPageMemberIds.includes(userId)) {
        return;
      }

      // 1페이지에 없다면 앞으로 이동
      moveToFront(userId);
    },
    [orderedMemberIds, firstPageMemberCount, moveToFront],
  );

  useEffect(() => {
    if (!socket || !recvTransport || !device) return;

    const onCameraProduced = async (producerInfo: ProducerInfo) => {
      const { user_id: userId, producer_id: producerId, type } = producerInfo;

      // 기존 컨슈머가 있는지 확인 (Resume 처리)
      const consumers = useMeetingSocketStore.getState().consumers;
      const existingConsumer = consumers[producerId];

      if (existingConsumer) {
        // 이미 연결된 적이 있다면 Resume 요청
        try {
          await socket.emitWithAck('signaling:ws:resume', {
            consumer_id: existingConsumer.id,
          });

          // 스트림 다시 연결
          setMemberStream(
            userId,
            type,
            new MediaStream([existingConsumer.track]),
          );
        } catch (error) {
          console.error('Resume failed:', error);
        }
      }

      if (type === 'cam') {
        checkAndMoveToFront(userId);
      }
    };

    const onAlertProduced = (producerInfo: ProducerInfo) => {
      if (producerInfo.type === 'cam' && producerInfo.is_restart) {
        checkAndMoveToFront(producerInfo.user_id);
      }
    };

    socket.on('room:camera_on', onCameraProduced);
    socket.on('room:alert_produced', onAlertProduced);

    return () => {
      socket.off('room:camera_on', onCameraProduced);
      socket.off('room:alert_produced', onAlertProduced);
    };
  }, [socket, recvTransport, device, setMemberStream, checkAndMoveToFront]);

  const onPrevClick = () => {
    if (!hasPrevPage) return;
    setCurrentPage((prev) => prev - 1);
  };

  const onNextClick = () => {
    if (!hasNextPage) return;
    setCurrentPage((prev) => prev + 1);
  };

  return (
    <header className="flex w-full justify-between px-4 py-2">
      <button
        className={`h-full rounded-sm ${hasPrevPage ? 'text-neutral-200 hover:bg-neutral-700' : 'cursor-default! text-neutral-700'}`}
        onClick={onPrevClick}
      >
        <ChevronLeftIcon className="h-8 w-8" />
      </button>

      <section className="flex gap-4">
        {currentPage === 1 && <MyVideo />}
        {visibleMembers.map((member) => (
          <MemberVideo key={member.user_id} {...member} />
        ))}
      </section>

      <button
        className={`h-full rounded-sm ${hasNextPage ? 'text-neutral-200 hover:bg-neutral-700' : 'cursor-default! text-neutral-700'}`}
        onClick={onNextClick}
      >
        <ChevronRightIcon className="h-8 w-8" />
      </button>
    </header>
  );
}
