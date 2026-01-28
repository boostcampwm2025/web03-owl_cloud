'use client';

import { useMemo, useState, useEffect } from 'react';

import Konva from 'konva';
import { Image as KonvaImage, Group, Rect } from 'react-konva';
import useImage from 'use-image';

import { YoutubeItem as YoutubeItemType } from '@/types/whiteboard';
import { getMaxResThumbnailUrl, getHqThumbnailUrl } from '@/utils/youtube';
import { useItemAnimation } from '@/hooks/useItemAnimation';

interface YoutubeItemProps {
  youtubeItem: YoutubeItemType;
  isDraggable: boolean;
  isListening: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (newAttrs: Partial<YoutubeItemType>) => void;
  onMouseEnter: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onMouseLeave: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export default function YoutubeItem({
  youtubeItem,
  isDraggable,
  isListening,
  isSelected,
  onSelect,
  onChange,
  onMouseEnter,
  onMouseLeave,
  onDragStart,
  onDragEnd,
}: YoutubeItemProps) {
  const [thumbnailImage, setThumbnailImage] = useState<HTMLImageElement | null>(
    null,
  );
  const [playIconBitmap] = useImage('/icons/youtubeIcon.svg');
  const [isDragging, setIsDragging] = useState(false);

  // 애니메이션 훅
  const groupRef = useItemAnimation({
    x: youtubeItem.x,
    y: youtubeItem.y,
    width: youtubeItem.width,
    height: youtubeItem.height,
    isSelected,
    isDragging,
  });

  // 이미지 로딩 및 Fallback 처리 로직
  useEffect(() => {
    // 마운트 상태 추적
    let isMounted = true;
    // 썸네일 URL
    // maxResUrl : 고화질
    // hqUrl : 중화질 (고화질 없을 때 대비)
    const maxResUrl = getMaxResThumbnailUrl(youtubeItem.videoId);
    const hqUrl = getHqThumbnailUrl(youtubeItem.videoId);

    // 이미지 객체 생성
    const img = new Image();
    img.src = maxResUrl;
    img.crossOrigin = 'anonymous';

    // 고화질 로드 성공 시
    img.onload = () => {
      if (isMounted) setThumbnailImage(img);
    };

    // 고화질 로드 실패 시 -> 중화질 시도 (Fallback)
    img.onerror = () => {
      // 실패했으므로 중화질 URL로 이미지 생성
      const fallbackImg = new Image();
      fallbackImg.src = hqUrl;
      fallbackImg.crossOrigin = 'anonymous';

      fallbackImg.onload = () => {
        if (isMounted) setThumbnailImage(fallbackImg);
      };

      fallbackImg.onerror = () => {
        // 중화질도 실패하면 그냥 null 상태 유지 (회색 배경 보임)
        console.warn('유튜브 썸네일 이미지 로드 실패');
      };
    };

    return () => {
      isMounted = false;
    };
  }, [youtubeItem.videoId]);

  // 비율 유지 크롭 (thumbnailImage가 있을 때만 계산)
  const cropConfig = useMemo(() => {
    if (!thumbnailImage) return null;

    // 이미지 크기
    const imageWidth = thumbnailImage.width;
    const imageHeight = thumbnailImage.height;

    // 컨테이너 크기
    const containerWidth = youtubeItem.width;
    const containerHeight = youtubeItem.height;

    // 이미지와 컨테이너 비율 계산
    const imageRatio = imageWidth / imageHeight;
    const containerRatio = containerWidth / containerHeight;

    // 크롭 영역 계산
    let cropX = 0;
    let cropY = 0;
    let cropWidth = imageWidth;
    let cropHeight = imageHeight;

    // 컨테이너 비율에 맞게 크롭
    if (containerRatio > imageRatio) {
      cropHeight = imageWidth / containerRatio;
      cropY = (imageHeight - cropHeight) / 2;
    } else {
      cropWidth = imageHeight * containerRatio;
      cropX = (imageWidth - cropWidth) / 2;
    }

    return {
      x: cropX,
      y: cropY,
      width: cropWidth,
      height: cropHeight,
    };
  }, [thumbnailImage, youtubeItem.width, youtubeItem.height]);

  // 링크 이동 핸들러
  // _blank : 새탭에서 열기
  // _self : 현재 탭에서 열기
  // 추후에 모달이나 팝업으로 재생하는 것도 고려 해봐도 괜찮음 -> 추후 논의 필요
  const handleOpenLink = () => {
    if (typeof window !== 'undefined') {
      window.open(youtubeItem.url, '_blank');
    }
  };

  return (
    <Group
      ref={groupRef as React.RefObject<Konva.Group>}
      id={youtubeItem.id}
      x={youtubeItem.x}
      y={youtubeItem.y}
      width={youtubeItem.width}
      height={youtubeItem.height}
      rotation={youtubeItem.rotation}
      draggable={isDraggable}
      listening={isListening}
      onMouseDown={onSelect}
      onTouchStart={onSelect}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onDragStart={() => {
        setIsDragging(true);
        onDragStart?.();
      }}
      onDblClick={handleOpenLink}
      onDragEnd={(e) => {
        setIsDragging(false);
        onChange({ x: e.target.x(), y: e.target.y() });
        onDragEnd?.();
      }}
      // 변형
      onTransformEnd={(e) => {
        const node = e.target;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();

        // 크기 보정
        node.scaleX(1);
        node.scaleY(1);

        onChange({
          x: node.x(),
          y: node.y(),
          width: Math.max(5, node.width() * scaleX),
          height: Math.max(5, node.height() * scaleY),
          rotation: node.rotation(),
        });
      }}
    >
      {/* 배경 */}
      <Rect
        width={youtubeItem.width}
        height={youtubeItem.height}
        fill="#2c2c2c"
        cornerRadius={youtubeItem.cornerRadius}
        stroke={youtubeItem.stroke}
        strokeWidth={youtubeItem.strokeWidth}
        opacity={youtubeItem.opacity}
        dash={youtubeItem.dash}
      />

      {/* 썸네일 이미지 */}
      {thumbnailImage && cropConfig && (
        <KonvaImage
          image={thumbnailImage}
          width={youtubeItem.width}
          height={youtubeItem.height}
          crop={cropConfig}
          cornerRadius={youtubeItem.cornerRadius}
          opacity={youtubeItem.opacity}
          stroke={youtubeItem.stroke}
          strokeWidth={youtubeItem.strokeWidth}
          dash={youtubeItem.dash}
        />
      )}

      {/* 중앙 재생 버튼 그룹 */}
      <Group
        x={youtubeItem.width / 2}
        y={youtubeItem.height / 2}
        onClick={(e) => {
          e.cancelBubble = true;
          handleOpenLink();
        }}
        onTap={(e) => {
          e.cancelBubble = true;
          handleOpenLink();
        }}
        onMouseEnter={(e) => {
          const container = e.target.getStage()?.container();
          if (container) container.style.cursor = 'pointer';
        }}
        onMouseLeave={(e) => {
          const container = e.target.getStage()?.container();
          if (container) container.style.cursor = 'default';
        }}
      >
        {/* SVG 아이콘 이미지 렌더링 */}
        {playIconBitmap && (
          <KonvaImage
            image={playIconBitmap}
            width={60}
            height={50}
            x={-30}
            y={-20}
            shadowColor="black"
            shadowBlur={5}
            shadowOpacity={0.4}
          />
        )}
      </Group>
    </Group>
  );
}
