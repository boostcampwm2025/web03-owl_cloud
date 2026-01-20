'use client';

import StrokeColorSection from '@/components/whiteboard/sidebar/sections/StrokeColorSection';
import ButtonGroup from '@/components/whiteboard/sidebar/ui/ButtonGroup';
import type { DrawingSize } from '@/constants/drawingPresets';

// DrawingPanel 컴포넌트
interface DrawingPanelProps {
  stroke: string;
  size: DrawingSize;
  onChangeStroke: (color: string) => void;
  onChangeSize: (size: DrawingSize) => void;
}

export default function DrawingPanel({
  stroke,
  size,
  onChangeStroke,
  onChangeSize,
}: DrawingPanelProps) {
  return (
    <div className="flex flex-col gap-2">
      {/* 그리기 색상 설정 섹션 */}
      <StrokeColorSection
        title="color"
        color={stroke}
        onChange={onChangeStroke}
        allowTransparent={false}
      />

      {/* 그리기 크기 설정 섹션 */}
      <ButtonGroup
        label="stroke width"
        options={[
          { value: 'S' as DrawingSize, label: 'S' },
          { value: 'M' as DrawingSize, label: 'M' },
          { value: 'L' as DrawingSize, label: 'L' },
        ]}
        value={size}
        onChange={onChangeSize}
      />
    </div>
  );
}
