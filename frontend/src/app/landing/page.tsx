'use client';

import { motion, useSpring } from 'framer-motion';
import CardItem from '@/components/card/CardItem';
import { useMotionValue } from 'framer-motion';
import { useState } from 'react';

const VISIBLE_COUNT = 90;

// 임시 카드 데이터
const CARDS = Array.from({ length: VISIBLE_COUNT }, (_, i) => ({
  id: `card-${i}`,
}));

export default function LandingPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="flex w-full max-w-90 flex-col gap-16 px-6 py-4">
        <section
          className="flex flex-col items-center gap-8"
          aria-labelledby="start-meeting-title"
        >
          <h2
            id="start-meeting-title"
            className="text-2xl font-bold text-neutral-900"
          >
            새 회의 시작
          </h2>
          <Button>시작하기</Button>
        </section>

        {/* 구분선 */}
        <div
          className="flex w-full items-center gap-4 text-neutral-500"
          aria-hidden
        >
          <span className="h-px flex-1 bg-neutral-500" />
          <span className="text-sm font-bold">또는</span>
          <span className="h-px flex-1 bg-neutral-500" />
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
    </main>
  );
}
