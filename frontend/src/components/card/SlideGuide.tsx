'use client';

import { motion } from 'framer-motion';

export default function SlideGuide() {
  return (
    <motion.div
      className="pointer-events-none absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-3 text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.6 }}
    >
      {/* 왼쪽 화살표 */}
      <motion.span
        animate={{ x: [-6, 6, -6] }}
        transition={{
          duration: 1.6,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="text-xl"
      >
        ←
      </motion.span>

      <span className="text-base font-semibold whitespace-nowrap">
        슬라이드로 카드 선택
      </span>

      {/* 오른쪽 화살표 */}
      <motion.span
        animate={{ x: [6, -6, 6] }}
        transition={{
          duration: 1.6,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="text-xl"
      >
        →
      </motion.span>
    </motion.div>
  );
}
