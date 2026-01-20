'use client';

import { useEffect, useRef, useMemo, useState } from 'react';

import Konva from 'konva';
import { Image as KonvaImage, Group, Circle, Path } from 'react-konva';

import { VideoItem as VideoItemType } from '@/types/whiteboard';

// Mute Icon Paths
const MUTE_PATHS = [
  'M22.3691 6.43943C22.3687 5.77014 22.1824 5.1141 21.8309 4.54453C21.4795 3.97496 20.9766 3.51426 20.3785 3.21385C19.7805 2.91343 19.1107 2.78512 18.4439 2.84323C17.7771 2.90134 17.1396 3.14358 16.6025 3.54292L7.26414 10.4904H3.6116C2.65375 10.4904 1.73512 10.8709 1.05781 11.5483C0.380507 12.2256 0 13.1442 0 14.102V17.899C0 18.8569 0.380507 19.7755 1.05781 20.4528C1.73512 21.1301 2.65375 21.5106 3.6116 21.5106H7.26414L16.6025 28.4594C17.1397 28.8591 17.7774 29.1017 18.4445 29.1599C19.1116 29.2181 19.7817 29.0898 20.38 28.7892C20.9783 28.4886 21.4813 28.0276 21.8328 27.4576C22.1842 26.8877 22.3703 26.2313 22.3703 25.5617L22.3691 6.43943ZM19.9613 6.43943V25.5617C19.9613 25.7852 19.8991 26.0044 19.7815 26.1946C19.664 26.3848 19.4958 26.5384 19.2958 26.6384C19.0959 26.7384 18.872 26.7807 18.6493 26.7607C18.4267 26.7406 18.214 26.6589 18.0351 26.5247L8.37771 19.3377C8.16933 19.1814 7.91587 19.0969 7.65539 19.0969H3.6116C3.29232 19.0969 2.98611 18.9701 2.76034 18.7443C2.53457 18.5185 2.40773 18.2123 2.40773 17.893V14.102C2.40773 13.7828 2.53457 13.4765 2.76034 13.2508C2.98611 13.025 3.29232 12.8982 3.6116 12.8982H7.66262C7.9231 12.8982 8.17655 12.8137 8.38494 12.6574L18.0424 5.47031C18.2212 5.33617 18.4339 5.25448 18.6566 5.2344C18.8792 5.21433 19.1031 5.25665 19.3031 5.35664C19.503 5.45662 19.6712 5.61031 19.7888 5.8005C19.9063 5.99068 19.9685 6.20984 19.9685 6.43341L19.9613 6.43943Z',
  'M24.7359 13.0727L29.8331 19.8697C29.9279 19.9962 30.0468 20.1027 30.1828 20.1833C30.3188 20.2638 30.4694 20.3168 30.6259 20.3392C30.7824 20.3615 30.9418 20.3528 31.0949 20.3136C31.2481 20.2744 31.392 20.2053 31.5185 20.1105C31.645 20.0156 31.7515 19.8968 31.8321 19.7608C31.9126 19.6247 31.9656 19.4742 31.9879 19.3176C32.0103 19.1611 32.0016 19.0018 31.9624 18.8486C31.9231 18.6955 31.8541 18.5515 31.7593 18.4251L26.6621 11.628C26.4705 11.3726 26.1853 11.2037 25.8692 11.1586C25.5532 11.1134 25.2321 11.1957 24.9767 11.3873C24.7212 11.5788 24.5524 11.864 24.5072 12.1801C24.4621 12.4962 24.5443 12.8172 24.7359 13.0727Z',
  'M29.8331 11.628L24.7359 18.4251C24.5443 18.6805 24.4621 19.0016 24.5072 19.3176C24.5524 19.6337 24.7212 19.9189 24.9767 20.1105C25.2321 20.3021 25.5532 20.3843 25.8692 20.3392C26.1853 20.294 26.4705 20.1251 26.6621 19.8697L31.7593 13.0727C31.9508 12.8172 32.0331 12.4962 31.9879 12.1801C31.9428 11.864 31.7739 11.5788 31.5185 11.3873C31.392 11.2924 31.2481 11.2234 31.0949 11.1841C30.9418 11.1449 30.7824 11.1362 30.6259 11.1586C30.3098 11.2037 30.0246 11.3726 29.8331 11.628Z',
];

// Unmute Icon Paths
const UNMUTE_PATHS = [
  'M21.558 6.78713C21.5581 6.14181 21.3787 5.50918 21.04 4.9599C20.7013 4.41062 20.2166 3.96631 19.6399 3.67661C19.0633 3.38691 18.4175 3.26321 17.7746 3.31935C17.1317 3.37548 16.5171 3.60923 15.9994 3.99448L7.00076 10.6913H3.48066C2.55753 10.6913 1.67221 11.058 1.01946 11.7107C0.366711 12.3635 0 13.2488 0 14.1719V17.8313C0 18.7544 0.366711 19.6397 1.01946 20.2925C1.67221 20.9452 2.55753 21.3119 3.48066 21.3119H7.00076L15.9994 28.0087C16.5171 28.394 17.1317 28.6277 17.7746 28.6838C18.4175 28.74 19.0633 28.6163 19.6399 28.3266C20.2166 28.0369 20.7013 27.5926 21.04 27.0433C21.3787 26.494 21.5581 25.8614 21.558 25.216V6.78713ZM19.2376 6.78713V25.216C19.2376 25.4315 19.1776 25.6427 19.0643 25.826C18.951 26.0093 18.789 26.1574 18.5962 26.2538C18.4035 26.3501 18.1878 26.3909 17.9732 26.3716C17.7586 26.3522 17.5536 26.2735 17.3812 26.1442L8.07744 19.2212C7.87662 19.0706 7.63235 18.9892 7.38131 18.9892H3.48066C3.17295 18.9892 2.87784 18.8669 2.66026 18.6493C2.44267 18.4318 2.32044 18.1366 2.32044 17.8289V14.1719C2.32044 13.8642 2.44267 13.5691 2.66026 13.3515C2.87784 13.1339 3.17295 13.0117 3.48066 13.0117H7.38479C7.63583 13.0117 7.8801 12.9303 8.08092 12.7797L17.3882 5.85432C17.5606 5.72504 17.7655 5.64631 17.9801 5.62696C18.1947 5.60761 18.4105 5.6484 18.6032 5.74476C18.7959 5.84112 18.958 5.98924 19.0713 6.17253C19.1846 6.35581 19.2446 6.56702 19.2446 6.78249L19.2376 6.78713Z',
  'M24.3948 13.2174C24.8081 13.5255 25.1438 13.9258 25.375 14.3866C25.6063 14.8474 25.7267 15.3558 25.7267 15.8714C25.7267 16.3869 25.6063 16.8953 25.375 17.3561C25.1438 17.8169 24.8081 18.2173 24.3948 18.5254C24.2729 18.6168 24.1702 18.7313 24.0925 18.8624C24.0149 18.9935 23.9639 19.1386 23.9423 19.2895C23.9208 19.4403 23.9292 19.5939 23.967 19.7415C24.0048 19.8891 24.0713 20.0278 24.1627 20.1497C24.2541 20.2716 24.3687 20.3743 24.4998 20.4519C24.6309 20.5295 24.776 20.5806 24.9268 20.6021C25.0776 20.6236 25.2312 20.6153 25.3788 20.5775C25.5264 20.5396 25.6651 20.4731 25.787 20.3817C26.4892 19.8575 27.0594 19.1767 27.4522 18.3934C27.8449 17.6101 28.0495 16.7459 28.0495 15.8696C28.0495 14.9933 27.8449 14.1292 27.4522 13.3459C27.0594 12.5625 26.4892 11.8817 25.787 11.3575C25.6651 11.2661 25.5264 11.1996 25.3788 11.1618C25.2312 11.124 25.0776 11.1156 24.9268 11.1371C24.776 11.1587 24.6309 11.2097 24.4998 11.2874C24.3687 11.365 24.2541 11.4677 24.1627 11.5896C24.0713 11.7115 24.0048 11.8502 23.967 11.9978C23.9292 12.1454 23.9208 12.299 23.9423 12.4498C23.9639 12.6006 24.0149 12.7457 24.0925 12.8768C24.1702 13.0079 24.2729 13.1225 24.3948 13.2139V13.2174Z',
  'M25.1734 9.19715C26.5044 9.73485 27.6444 10.658 28.4472 11.8481C29.25 13.0382 29.6789 14.441 29.6789 15.8765C29.6789 17.3121 29.25 18.7149 28.4472 19.905C27.6444 21.0951 26.5044 22.0182 25.1734 22.5559C25.0311 22.6123 24.9014 22.6963 24.7918 22.8031C24.6821 22.9098 24.5947 23.0372 24.5345 23.1779C24.4743 23.3186 24.4425 23.4698 24.441 23.6228C24.4394 23.7758 24.4682 23.9276 24.5256 24.0695C24.583 24.2113 24.6679 24.3404 24.7753 24.4493C24.8828 24.5583 25.0108 24.6448 25.1519 24.7041C25.293 24.7633 25.4444 24.7941 25.5974 24.7946C25.7504 24.7951 25.9021 24.7653 26.0435 24.707C27.803 23.9959 29.31 22.7754 30.3711 21.2021C31.4323 19.6287 31.9992 17.7743 31.9992 15.8765C31.9992 13.9788 31.4323 12.1243 30.3711 10.551C29.31 8.97762 27.803 7.75715 26.0435 7.0461C25.7588 6.93315 25.4409 6.9374 25.1592 7.05793C24.8776 7.17846 24.6551 7.40549 24.5402 7.68948C24.4253 7.97347 24.4274 8.29137 24.546 8.57382C24.6646 8.85627 24.8901 9.08034 25.1734 9.19715Z',
];

interface VideoItemProps {
  videoItem: VideoItemType;
  onSelect: () => void;
  onChange: (newAttrs: Partial<VideoItemType>) => void;
  onMouseEnter: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onMouseLeave: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export default function VideoItem({
  videoItem,
  onSelect,
  onChange,
  onMouseEnter,
  onMouseLeave,
  onDragStart,
  onDragEnd,
}: VideoItemProps) {
  // KonvaImage 이미지 객체 참조
  const imageRef = useRef<Konva.Image>(null);

  // 소리 상태 관리 (초기값:음소거 상태)
  const [isMuted, setIsMuted] = useState(true);

  // HTML Video Element 생성
  // Konva에 Video 컴포넌트가 없어서 HTML video 태그를 만들어서 Image 컴포넌트에 전달ㄹ
  const videoElement = useMemo(() => {
    // SSR 방지
    if (typeof window === 'undefined') return null;

    // 메모리에 가상의 video 태그 생성
    const videoId = document.createElement('video');
    videoId.src = videoItem.src;

    // CORS 문제 방지용 설정
    videoId.crossOrigin = 'anonymous';

    // 음소거 설정
    videoId.muted = true;

    // 반복 재생 설정
    videoId.loop = true;

    // 자동 재생 설정
    videoId.autoplay = true;
    return videoId;
  }, [videoItem.src]);

  // 비디오 재생 및 애니메이션 레이어 갱신
  useEffect(() => {
    if (!videoElement) return;

    // 비디오 로드 후 재생 시작(메모리 상에서 비디오 동작)
    const playVideo = async () => {
      try {
        await videoElement.play();
      } catch (error) {
        // 추후에 사용자에게 알림 주는 로직 추가
        console.warn('비디오 자동 재생 실패', error);
      }
    };
    playVideo();

    // Konva 애니메이션 : 비디오 프레임마다 캔버스 갱신
    const animation = new Konva.Animation(() => {
      // 애니메이션이 돌아가는 동안 갱신
    }, imageRef.current?.getLayer());

    animation.start();

    // 정리 : 컴포넌트 언마운트 시 애니메이션 정지 및 비디오 일시정지
    return () => {
      animation.stop();
      videoElement.pause();
    };
  }, [videoElement]);

  // 소리 상태 토글 핸들러
  const handleToggleMute = (
    event: Konva.KonvaEventObject<MouseEvent | TouchEvent>,
  ) => {
    event.cancelBubble = true;

    if (videoElement) {
      const nextMutedState = !isMuted;

      // eslint-disable-next-line react-hooks/immutability
      videoElement.muted = nextMutedState;
      setIsMuted(nextMutedState);
    }
  };

  // 현재 상태에 맞는 아이콘 선택
  const currentPaths = isMuted ? MUTE_PATHS : UNMUTE_PATHS;

  return (
    <Group
      id={videoItem.id}
      // 위치
      x={videoItem.x}
      y={videoItem.y}
      // 크기
      width={videoItem.width}
      height={videoItem.height}
      // 회전
      rotation={videoItem.rotation}
      // 액션
      draggable
      onMouseDown={onSelect}
      onTouchStart={onSelect}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onDragStart={onDragStart}
      // 이동
      onDragEnd={(e) => {
        onChange({ x: e.target.x(), y: e.target.y() });
        onDragEnd?.();
      }}
      // 크기 조절 및 회전
      onTransformEnd={(e) => {
        const node = e.target;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();

        // 크기 보정
        node.scaleX(1);
        node.scaleY(1);

        // 실제 크기 계산(너비 / 높이)
        const newWidth = Math.max(5, node.width() * scaleX);
        const newHeight = Math.max(5, node.height() * scaleY);

        onChange({
          x: node.x(),
          y: node.y(),
          width: newWidth,
          height: newHeight,
          rotation: node.rotation(),
        });
      }}
    >
      {/* 비디오 */}
      <KonvaImage
        ref={imageRef}
        // 비디오 태그 연결
        image={videoElement as HTMLVideoElement}
        width={videoItem.width}
        height={videoItem.height}
        stroke={videoItem.stroke}
        strokeWidth={videoItem.strokeWidth}
        cornerRadius={videoItem.cornerRadius}
        opacity={videoItem.opacity}
        x={0}
        y={0}
        dash={videoItem.dash}
      />

      {/* 소리 조절 버튼 */}
      <Group
        // 버튼 위치
        x={videoItem.width - 30}
        y={videoItem.height - 30}
        onClick={handleToggleMute}
        onTap={handleToggleMute}
        onMouseEnter={(e) => {
          const container = e.target.getStage()?.container();
          if (container) container.style.cursor = 'pointer';
        }}
        onMouseLeave={(e) => {
          const container = e.target.getStage()?.container();
          if (container) container.style.cursor = 'default';
        }}
      >
        {/* 버튼 배경 설정 */}
        <Circle
          radius={20}
          fill="rgba(255, 255, 255, 0.8)"
          stroke="#e5e7eb"
          strokeWidth={1}
          shadowColor="black"
          shadowBlur={5}
          shadowOpacity={0.2}
          shadowOffset={{ x: 0, y: 2 }}
        />

        {/* SVG Path */}
        <Group
          // 아이콘 중앙 정렬
          x={-11}
          y={-11}
          // 아이콘 크기 조절
          scaleX={0.7}
          scaleY={0.7}
        >
          {currentPaths.map((d, i) => (
            <Path key={i} data={d} fill="#374151" />
          ))}
        </Group>
      </Group>
    </Group>
  );
}
