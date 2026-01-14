'use client';

import { useState } from 'react';
import ArrowStrokeSection from '@/components/whiteboard/sidebar/sections/ArrowStrokeSection';
import ArrowStyleSection from '@/components/whiteboard/sidebar/sections/ArrowStyleSection';
import ButtonGroup from '@/components/whiteboard/sidebar/ui/ButtonGroup';
import type { ArrowSize, ArrowStyle } from './arrowPresets';

// ArrowPanel 컴포넌트
interface ArrowPanelProps {
  stroke: string;
  size: ArrowSize;
  style: ArrowStyle;
  onChangeStroke: (color: string) => void;
  onChangeSize: (size: ArrowSize) => void;
  onChangeStyle: (style: ArrowStyle) => void;
}

export default function ArrowPanel({
  stroke,
  size,
  style,
  onChangeStroke,
  onChangeSize,
  onChangeStyle,
}: ArrowPanelProps) {
  const [arrowHeadType, setArrowHeadType] = useState<number>(0);
  const [arrowTailType, setArrowTailType] = useState<number>(0);

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
          { value: 0, label: '1' },
          { value: 1, label: '2' },
          { value: 2, label: '3' },
          { value: 3, label: '4' },
        ]}
        value={arrowHeadType}
        onChange={setArrowHeadType}
      />

      {/* Tail 옵션 */}
      <ButtonGroup
        label="Tail"
        options={[
          { value: 0, label: '1' },
          { value: 1, label: '2' },
          { value: 2, label: '3' },
          { value: 3, label: '4' },
        ]}
        value={arrowTailType}
        onChange={setArrowTailType}
      />
    </div>
  );
}
