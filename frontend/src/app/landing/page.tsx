'use client';

import { motion, useSpring } from 'framer-motion';
import CardItem from '@/components/card/CardItem';
import { useMotionValue } from 'framer-motion';
import { useState } from 'react';
import SlideGuide from '@/components/card/SlideGuide';

const VISIBLE_COUNT = 90;

// 임시 카드 데이터
const CARDS = Array.from({ length: VISIBLE_COUNT }, (_, i) => ({
  id: `card-${i}`,
}));

export default function LandingPage() {
  const rawRotation = useMotionValue(0); // 전역 회전값

  /** 스프링기반 부드러운 로테이션 주기
   * stiffness 낮을수록 → 더 부드러움
   * damping 낮을수록 → 더 말랑
   * 보통 damping 20~24
   */
  const smoothRotation = useSpring(rawRotation, {
    stiffness: 120,
    damping: 22,
    mass: 0.9,
  });

  const [isDragging, setIsDragging] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#9E3B34]">
      {/* 랜딩 타이틀 */}
      <div className="absolute top-24 w-full text-center text-white">
        <h1 className="text-[36px] leading-snug font-semibold">
          새로운 시작이 될
          <br />
          카드를 골라보세요
        </h1>
      </div>

      {/* 카드 영역 */}
      <motion.div
        className="absolute -bottom-210 left-1/2 -translate-x-1/2"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.06}
        onDragStart={() => {
          setIsDragging(true);
          setHoveredIndex(null);
        }}
        onDrag={(_, info) => {
          rawRotation.set(rawRotation.get() + info.delta.x * 0.08);
        }}
        onDragEnd={(_, info) => {
          rawRotation.set(rawRotation.get() + info.velocity.x * 0.02);
          setIsDragging(false);
        }}
      >
        {CARDS.map((card, idx) => (
          <CardItem
            key={card.id}
            index={idx}
            total={CARDS.length}
            rotation={smoothRotation}
            isDragging={isDragging}
            isHovered={hoveredIndex === idx}
            onHoverStart={() => !isDragging && setHoveredIndex(idx)}
            onHoverEnd={() => setHoveredIndex(null)}
          />
        ))}
      </motion.div>

      {/* 슬라이드 가이드 */}
      <SlideGuide />
    </main>
  );
}
