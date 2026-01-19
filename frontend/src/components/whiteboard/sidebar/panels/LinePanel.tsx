'use client';

import ArrowStrokeSection from '@/components/whiteboard/sidebar/sections/ArrowStrokeSection';
import ArrowStyleSection from '@/components/whiteboard/sidebar/sections/ArrowStyleSection';
import type { ArrowSize, ArrowStyle } from './arrowPresets';

// LinePanel 컴포넌트
interface LinePanelProps {
  stroke: string;
  size: ArrowSize;
  style: ArrowStyle;
  onChangeStroke: (color: string) => void;
  onChangeSize: (size: ArrowSize) => void;
  onChangeStyle: (style: ArrowStyle) => void;
}

export default function LinePanel({
  stroke,
  size,
  style,
  onChangeStroke,
  onChangeSize,
  onChangeStyle,
}: LinePanelProps) {
  return (
    <div className="flex flex-col gap-2">
      {/* Line 색상 설정 섹션 */}
      <ArrowStrokeSection color={stroke} onChange={onChangeStroke} />

      {/* Line 스타일 설정 섹션 */}
      <ArrowStyleSection
        size={size}
        style={style}
        onChangeSize={onChangeSize}
        onChangeStyle={onChangeStyle}
      />
    </div>
  );
}
