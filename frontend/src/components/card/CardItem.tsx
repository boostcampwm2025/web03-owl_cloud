import { motion, MotionValue, useTransform } from 'framer-motion';
import Image from 'next/image';

interface CardItemProps {
  index: number;
  total: number;
  rotation: MotionValue<number>;
  isDragging: boolean;
  isHovered: boolean;
  onHoverStart: () => void;
  onHoverEnd: () => void;
}

const RADIUS = 1200;
const ANGLE_GAP = 4;

export default function CardItem({
  index,
  total,
  rotation,
  isDragging,
  isHovered,
  onHoverStart,
  onHoverEnd,
}: CardItemProps) {
  const centerIndex = (total - 1) / 2;
  const offset = index - centerIndex;

  // 카드 고유 회전: 회전각도 -> 오프셋 기준으로 좌우대칭
  const baseRotate = offset * ANGLE_GAP;

  // 전역 회전 + 카드 회전 합성
  const rotate = useTransform(rotation, (r) => r + baseRotate);

  const activeHover = isHovered && !isDragging;

  return (
    <motion.div
      className="absolute top-0 left-1/2 will-change-transform"
      onHoverStart={onHoverStart}
      onHoverEnd={onHoverEnd}
      animate={{
        y: activeHover ? -RADIUS - 30 : -RADIUS,
        scale: activeHover ? 1.06 : isDragging ? 0.95 : 1,
      }}
      style={{
        rotate,
        y: -RADIUS,
        x: '-50%', // 중앙 정렬 보정
        transformOrigin: `10% ${RADIUS}px`,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      //   whileHover={
      //     isDragging
      //       ? undefined
      //       : {
      //           y: -RADIUS - 30,
      //           scale: 1.06,
      //         }
      //   }
      transition={{
        type: 'spring',
        stiffness: 260,
        damping: 26,
      }}
    >
      {/* 카드 */}
      <div className="relative h-60 w-35 select-none">
      </div>
    </motion.div>
  );
}
