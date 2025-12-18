'use client';

import React, { useRef, useState, useEffect, useMemo } from 'react';
import {
  Group,
  Image as KonvaImage,
  Rect,
  Circle,
  Path,
  Text,
} from 'react-konva';
import useImage from 'use-image';
import Konva from 'konva';
import { VideoItem as VideoItemType } from '@/types/workspace';

interface VideoItemProps {
  item: VideoItemType;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (newAttrs: Partial<VideoItemType>) => void;
}

export default function VideoItem({
  item,
  isSelected,
  onSelect,
  onChange,
}: VideoItemProps) {
  // Konva Ref 설정
  const groupRef = useRef<Konva.Group>(null);
  const imageRef = useRef<Konva.Image>(null);

  // local Video 파일 재생용 video 태그 객체 저장
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(
    null,
  );

  // 자동 재생 제어 상태
  const [isMuted, setIsMuted] = useState(true);

  // youtube 처리
  // workspace에서 직접 영상을 재생할 수 없어서 썸네일 이미지 불러와서 사용
  // youtube 정책 상 CORS,iframe 제약을 걸어둔다고 함
  // useMemo로 item.src가 바뀔 때만 URL 재계산
  const youtubeThumbnailUrl = useMemo(() => {
    if (item.sourceType === 'youtube') {
      return `https://img.youtube.com/vi/${item.src}/hqdefault.jpg`;
    }
    return undefined;
  }, [item.src, item.sourceType]);

  // youtube 썸네일 이미지 객체 변환
  const [youtubeImage] = useImage(youtubeThumbnailUrl || '', 'anonymous');

  const [youtubeIconBitmap] = useImage('/icons/sidebar/youtubeIcon.svg');

  const [muteIconBitmap] = useImage('/icons/sidebar/videoMuteIcon.svg');
  const [unMuteIconBitmap] = useImage('/icons/sidebar/videoUnMuteIcon.svg');

  // upload 처리 : 사용자가 올린 비디오 파일(Local Upload)
  useEffect(() => {
    if (item.sourceType === 'upload') {
      // upload 비디오용
      const uploadVideo = document.createElement('video');
      uploadVideo.src = item.src;
      uploadVideo.crossOrigin = 'anonymous';
      uploadVideo.muted = true;
      uploadVideo.autoplay = true;
      uploadVideo.loop = true;

      // 비디오 로드 완료 후 재생
      uploadVideo.onloadedmetadata = () => {
        uploadVideo
          .play()
          .catch((error) => console.error('자동 실행 실패: ', error));
        setVideoElement(uploadVideo);
      };
    }

    return () => {
      if (videoElement) {
        videoElement.pause();
        videoElement.src = '';
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.src, item.sourceType]);

  useEffect(() => {
    if (item.sourceType === 'upload' && videoElement && imageRef.current) {
      const layer = imageRef.current.getLayer();

      // Konva animation : video 프레임마다 캔버스 다시 그림
      const animation = new Konva.Animation(() => {}, layer);

      animation.start();

      return () => {
        animation.stop();
      };
    }
  }, [videoElement, item.sourceType]);

  // mute 토글
  const handleToggleMute = (
    e: Konva.KonvaEventObject<MouseEvent | TouchEvent>,
  ) => {
    // mute 버튼 클릭시 이벤트 버블링 방지용(음소거 버튼 눌렀는데 아이템 선택 안되도록 설정)
    e.cancelBubble = true;
    if (videoElement) {
      const nextMuteState = !videoElement.muted;
      videoElement.muted = nextMuteState;
      setIsMuted(nextMuteState);
    }
  };

  // 비디오 이동(좌표 수정)
  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    onChange({ x: e.target.x(), y: e.target.y() });
  };

  // 비디오 변형(크기,회전)
  const handleTransformEnd = () => {
    const node = groupRef.current;
    if (!node) return;
    onChange({
      x: node.x(),
      y: node.y(),
      rotation: node.rotation(),
      scaleX: node.scaleX(),
      scaleY: node.scaleY(),
    });
  };

  // youtube로 업로드된 video 더블클릭시 youtube 링크로 이동 되도록 설정
  // _blank : 새탭에서 열기
  // _self : 현재 탭에서 열기
  // 추후에 모달이나 팝업으로 재생하는 것도 고려 해봐도 괜찮음 -> 추후 논의 필요
  const handleDoubleClick = () => {
    if (item.sourceType === 'youtube') {
      window.open(`https://www.youtube.com/watch?v=${item.src}`, '_blank');
    }
  };

  // youtube 재생버튼(썸네일 위의 아이콘 클릭시) 클릭하면 새창으로 이동
  const handleOpenYoutube = (
    e: Konva.KonvaEventObject<MouseEvent | TouchEvent>,
  ) => {
    e.cancelBubble = true;
    window.open(`https://www.youtube.com/watch?v=${item.src}`, '_blank');
  };

  // mouse hover 시 커서 포인터 용도
  const handleMouseEnter = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const container = e.target.getStage()?.container();
    if (container) container.style.cursor = 'pointer';
  };

  // mouse leave 시 기본 커서로 변경
  const handleMouseLeave = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const container = e.target.getStage()?.container();
    if (container) container.style.cursor = 'default';
  };

  // 렌더링 리소스 : youtube 아니면 video element 넣기(rendering 되는 아이템)
  const renderImage =
    item.sourceType === 'youtube' ? youtubeImage : videoElement || undefined;

  return (
    <Group
      id={item.id}
      ref={groupRef}
      x={item.x}
      y={item.y}
      width={item.width}
      height={item.height}
      rotation={item.rotation}
      scaleX={item.scaleX}
      scaleY={item.scaleY}
      draggable={!item.isLocked}
      onClick={onSelect}
      onTap={onSelect}
      onDblClick={handleDoubleClick}
      onDragEnd={handleDragEnd}
      onTransformEnd={handleTransformEnd}
      opacity={item.opacity}
    >
      {/* 기본 배경 : lime-100 느낌의 HEX 코드 */}
      <Rect width={item.width} height={item.height} fill="#ecfcca" />

      {/* 추후에 이미지를 액자느낌이나 radius 적용해도 괜찮을 거 같습니다. : cornerRadius */}
      {/* 이미지 로딩 중 이거나 없을때 표시 */}
      {!renderImage && (
        <Text
          text="비디오 준비 중..."
          width={item.width}
          height={item.height}
          align="center"
          verticalAlign="middle"
          fontSize={14}
          fontStyle="bold"
          fill="#5ea501"
          listening={false}
        />
      )}

      {/* 비디오 / youtube 썸네일 렌더링 */}
      {renderImage && (
        <KonvaImage
          ref={imageRef}
          image={renderImage}
          width={item.width}
          height={item.height}
        />
      )}

      {/* 선택 표시 테두리 */}
      {isSelected && (
        <Rect
          width={item.width}
          height={item.height}
          stroke="#5ea501"
          strokeWidth={2}
          listening={false}
        />
      )}

      {/* youtube용 */}
      {item.sourceType === 'youtube' && renderImage && (
        <>
          <Rect
            width={item.width}
            height={item.height}
            fill="black"
            opacity={0.2}
            listening={false}
          />

          {/* youtube 썸네일 중앙 icon */}
          {youtubeIconBitmap && item.width && item.height && (
            <KonvaImage
              image={youtubeIconBitmap}
              width={64}
              height={44}
              // 중앙 배치
              x={item.width / 2 - 32}
              y={item.height / 2 - 22}
              // 클릭 및 커서 이벤트 연결
              onClick={handleOpenYoutube}
              onTap={handleOpenYoutube}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            />
          )}
        </>
      )}

      {/* upload video */}
      {item.sourceType === 'upload' &&
        renderImage &&
        item.width &&
        item.height && (
          <Group
            x={item.width - 20}
            y={item.height - 20}
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
            <Circle
              radius={16}
              fill="white"
              shadowColor="black"
              shadowBlur={4}
              shadowOpacity={0.2}
            />

            {isMuted
              ? muteIconBitmap && (
                  <KonvaImage
                    image={muteIconBitmap}
                    width={20}
                    height={20}
                    x={-10}
                    y={-10}
                    listening={false}
                  />
                )
              : unMuteIconBitmap && (
                  <KonvaImage
                    image={unMuteIconBitmap}
                    width={20}
                    height={20}
                    x={-10}
                    y={-10}
                    listening={false}
                  />
                )}
          </Group>
        )}
    </Group>
  );
}
