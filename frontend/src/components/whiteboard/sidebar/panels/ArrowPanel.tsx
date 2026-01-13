'use client';

import ArrowStrokeSection from '@/components/whiteboard/sidebar/sections/ArrowStrokeSection';
import ArrowStyleSection from '@/components/whiteboard/sidebar/sections/ArrowStyleSection';

// ArrowPanel 컴포넌트
interface ArrowPanelProps {
  stroke: string;
  size: 'S' | 'M' | 'L';
  style: 'straight' | 'curved';
  onChangeStroke: (color: string) => void;
  onChangeSize: (size: 'S' | 'M' | 'L') => void;
  onChangeStyle: (style: 'straight' | 'curved') => void;
}

export default function ArrowPanel({
  stroke,
  size,
  style,
  onChangeStroke,
  onChangeSize,
  onChangeStyle,
}: ArrowPanelProps) {
  return (
    <div className="flex flex-col gap-2">
      {/* Arrow 색상 설정 섹션 */}
      <ArrowStrokeSection color={stroke} onChange={onChangeStroke} />

      {/* Arrow 스타일 설정 섹션 */}
      <ArrowStyleSection
        size={size}
        style={style}
        onChangeSize={onChangeSize}
        onChangeStyle={onChangeStyle}
      />
    </div>
  );
}
