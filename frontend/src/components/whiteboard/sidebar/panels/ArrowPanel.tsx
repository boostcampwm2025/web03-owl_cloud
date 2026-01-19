'use client';

import ArrowStrokeSection from '@/components/whiteboard/sidebar/sections/ArrowStrokeSection';
import ArrowStyleSection from '@/components/whiteboard/sidebar/sections/ArrowStyleSection';
import ButtonGroup from '@/components/whiteboard/sidebar/ui/ButtonGroup';
import type { ArrowSize, ArrowStyle } from './arrowPresets';
import type { ArrowHeadType } from '@/types/whiteboard';

// ArrowPanel 컴포넌트
interface ArrowPanelProps {
  stroke: string;
  size: ArrowSize;
  style: ArrowStyle;
  startHeadType?: ArrowHeadType;
  endHeadType?: ArrowHeadType;
  onChangeStroke: (color: string) => void;
  onChangeSize: (size: ArrowSize) => void;
  onChangeStyle: (style: ArrowStyle) => void;
  onChangeStartHeadType: (type: ArrowHeadType) => void;
  onChangeEndHeadType: (type: ArrowHeadType) => void;
}

export default function ArrowPanel({
  stroke,
  size,
  style,
  startHeadType = 'none',
  endHeadType = 'triangle',
  onChangeStroke,
  onChangeSize,
  onChangeStyle,
  onChangeStartHeadType,
  onChangeEndHeadType,
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

      {/* Head 옵션 */}
      <ButtonGroup
        label="Head"
        options={[
          { value: 'none' as ArrowHeadType, label: '—' },
          { value: 'triangle' as ArrowHeadType, label: '▷' },
          { value: 'chevron' as ArrowHeadType, label: '>' },
          { value: 'doubleChevron' as ArrowHeadType, label: '>>' },
          { value: 'line' as ArrowHeadType, label: '|' },
        ]}
        value={endHeadType}
        onChange={onChangeEndHeadType}
      />

      {/* Tail 옵션 */}
      <ButtonGroup
        label="Tail"
        options={[
          { value: 'none' as ArrowHeadType, label: '—' },
          { value: 'triangle' as ArrowHeadType, label: '▷' },
          { value: 'chevron' as ArrowHeadType, label: '>' },
          { value: 'doubleChevron' as ArrowHeadType, label: '>>' },
          { value: 'line' as ArrowHeadType, label: '|' },
        ]}
        value={startHeadType}
        onChange={onChangeStartHeadType}
      />
    </div>
  );
}
