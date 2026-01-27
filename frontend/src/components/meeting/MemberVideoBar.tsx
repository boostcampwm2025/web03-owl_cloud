'use client';

import { ChevronLeftIcon, ChevronRightIcon } from '@/assets/icons/common';
import MyVideo from '@/components/meeting/MyVideo';
import MemberVideo from '@/components/meeting/MemberVideo';
import { useMeetingSocketStore } from '@/store/useMeetingSocketStore';
import { useMeetingStore } from '@/store/useMeetingStore';
import { ConsumerInfo } from '@/types/meeting';
import {
  getConsumerInstances,
  getMembersPerPage,
  getVideoConsumerIds,
} from '@/utils/meeting';
import { useEffect, useMemo, useState } from 'react';
import { useWindowSize } from '@/hooks/useWindowSize';

export default function MemberVideoBar() {
  const { width } = useWindowSize();

  const MEMBERS_PER_PAGE = useMemo(() => {
    return getMembersPerPage(width);
  }, [width]);
  const firstPageMemberCount = MEMBERS_PER_PAGE - 1;

  const { members, setMemberStream, removeMemberStream, orderedMemberIds } =
    useMeetingStore();
  const { socket, recvTransport, device, addConsumers } =
    useMeetingSocketStore();
  const [currentPage, setCurrentPage] = useState(1);

  // 전체 페이지 수 계산 (첫 페이지는 MyVideo 포함)
  const totalPages = useMemo(() => {
    const memberCount = Object.values(members).length;
    if (memberCount <= firstPageMemberCount) return 1;
    return (
      1 + Math.ceil((memberCount - firstPageMemberCount) / MEMBERS_PER_PAGE)
    );
  }, [members, firstPageMemberCount, MEMBERS_PER_PAGE]);

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
      : (currentPage - 2) * MEMBERS_PER_PAGE + firstPageMemberCount;
    const end = isFirstPage ? firstPageMemberCount : start + MEMBERS_PER_PAGE;

    return sortedMembers.slice(start, end);
  }, [sortedMembers, currentPage, firstPageMemberCount, MEMBERS_PER_PAGE]);

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
      } = getVideoConsumerIds(members, visibleMembers, currentConsumers);

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
  }, [visibleMembers, socket, recvTransport, device]);

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
