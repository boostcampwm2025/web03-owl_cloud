'use client';

import ArrowStrokeSection from '@/components/whiteboard/sidebar/sections/ArrowStrokeSection';
import ArrowStyleSection from '@/components/whiteboard/sidebar/sections/ArrowStyleSection';
import type { ArrowSize, ArrowStyle } from '@/constants/arrowPresets';
import LayerSection, {
  LayerDirection,
} from '@/components/whiteboard/sidebar/sections/LayerSection';

// LinePanel 컴포넌트
interface LinePanelProps {
  stroke: string;
  size: ArrowSize;
  style: ArrowStyle;
  onChangeStroke: (color: string) => void;
  onChangeSize: (size: ArrowSize) => void;
  onChangeStyle: (style: ArrowStyle) => void;
  onChangeLayer: (direction: LayerDirection) => void;
}

export default function LinePanel({
  stroke,
  size,
  style,
  onChangeStroke,
  onChangeSize,
  onChangeStyle,
  onChangeLayer,
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
      {/* 레이어 (Layer) */}
      <LayerSection onChangeLayer={onChangeLayer} />
    </div>
  );
}
