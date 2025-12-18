'use client';

import { AnimatePresence, motion, useSpring } from 'framer-motion';
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

  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#9E3B34]">
      {/* 랜딩 타이틀 */}
      <AnimatePresence mode="wait">
        {!selectedId && (
          <motion.div
            key="default-title"
            className="absolute top-24 w-full text-center text-white"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
          >
            <h1 className="text-[36px] leading-snug font-semibold">
              새로운 시작이 될
              <br />
              카드를 골라보세요
            </h1>
          </motion.div>
        )}
        {selectedId && (
          <motion.div
            key="selected-title"
            className="absolute top-24 w-full text-center text-white"
            initial={{ opacity: 0, y: -10 }}
            animate={{
              opacity: [0, 1, 1, 0],
              y: [-10, 0, 0, -10],
            }}
            transition={{
              times: [0, 0.1, 0.8, 1],
              duration: 2.8,
              ease: 'easeInOut',
            }}
          >
            <h1 className="text-[36px] leading-snug font-semibold">
              과연 어떤
              <br />
              카드일까요...?
            </h1>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 카드 영역 */}
      <motion.div
        className={`absolute -bottom-220 left-1/2 -translate-x-1/2 ${
          selectedId ? 'pointer-events-none' : '' // 선택 시 카드 전체 클릭 차단
        }`}
        drag={selectedId ? false : 'x'}
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
            isSelected={selectedId === card.id}
            onSelect={() => setSelectedId(card.id)}
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
      {!selectedId && <SlideGuide />}
    </main>
  );
}
