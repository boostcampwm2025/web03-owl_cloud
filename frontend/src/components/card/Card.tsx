'use client';

import { useCardDetailStore } from '@/store/useCardDetailStore';
import { CardData, ImageItem } from '@/types/workspace';
import { useEffect, useRef, useState } from 'react';
import { Image, Layer, Stage, Text } from 'react-konva';
import useImage from 'use-image';

function CardImage({ item }: { item: ImageItem }) {
  const [img] = useImage(item.src);

  return (
    <Image
      image={img}
      x={item.x}
      y={item.y}
      width={item.width}
      height={item.height}
      scaleX={item.scaleX}
      scaleY={item.scaleY}
      rotation={item.rotation}
      opacity={item.opacity}
      alt="카드 내 이미지"
    />
  );
}

export default function Card({ initialData }: { initialData: CardData }) {
  const { cardData, setCardData, isLoading } = useCardDetailStore();
  useEffect(() => {
    // 카드 정보 전역 변수 설정
    setCardData(initialData);
  }, [setCardData, initialData]);

  const sortedItems = [...cardData.items].sort((a, b) => a.zIndex - b.zIndex);
  const isHorizontal = cardData.workspaceWidth === 1200;

  // 현재 화면 크기에 맞게 카드 비율 조정
  const cardRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const handleResize = () => {
      if (cardRef.current) {
        const containerWidth = cardRef.current.offsetWidth;
        const newScale = containerWidth / cardData.workspaceWidth;
        setScale(newScale);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [cardData.workspaceWidth]);

  return (
    !isLoading && (
      <div
        ref={cardRef}
        className={`${isHorizontal ? 'aspect-12/7 w-full' : 'aspect-7/12 h-full'} overflow-hidden rounded-2xl border-neutral-200 shadow-md`}
      >
        <Stage
          width={cardData.workspaceWidth * scale}
          height={cardData.workspaceHeight * scale}
          scaleX={scale}
          scaleY={scale}
          style={{
            backgroundColor: cardData.backgroundColor,
            boxShadow: '0 0 10px rgba(0,0,0,0.1)',
          }}
        >
          <Layer>
            {sortedItems.map((item) => {
              if (item.type === 'image') {
                return <CardImage key={item.id} item={item} />;
              }

              if (item.type === 'text') {
                return (
                  <Text
                    key={item.id}
                    text={item.text}
                    x={item.x}
                    y={item.y}
                    width={item.width}
                    fontSize={item.fontSize}
                    fontFamily={item.fontFamily}
                    fill={item.fill}
                    fontStyle={item.fontStyle}
                    align={item.align}
                    scaleX={item.scaleX}
                    scaleY={item.scaleY}
                    rotation={item.rotation}
                    wrap={item.wrap}
                  />
                );
              }

              return null;
            })}
          </Layer>
        </Stage>
      </div>
    )
  );
}
