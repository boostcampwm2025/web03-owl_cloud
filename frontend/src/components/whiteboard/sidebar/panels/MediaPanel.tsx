'use client';

import StrokeColorSection from '@/components/whiteboard/sidebar/sections/StrokeColorSection';
import StrokeWidthSection from '@/components/whiteboard/sidebar/sections/StrokeWidthSection';
import StrokeStyleSection, {
  StrokeStyleType,
} from '@/components/whiteboard/sidebar/sections/StrokeStyleSection';
import EdgesSection, {
  EdgeType,
} from '@/components/whiteboard/sidebar/sections/EdgesSection';
import OpacitySection from '@/components/whiteboard/sidebar/sections/OpacitySection';

interface MediaPanelProps {
  strokeColor: string;
  strokeWidth: number;
  strokeStyle: StrokeStyleType;
  edgeType: EdgeType;
  opacity: number;

  onChangeStrokeColor: (color: string) => void;
  onChangeStrokeWidth: (width: number) => void;
  onChangeStrokeStyle: (style: StrokeStyleType) => void;
  onChangeEdgeType: (type: EdgeType) => void;
  onChangeOpacity: (opacity: number) => void;
}

export default function MediaPanel({
  strokeColor,
  strokeWidth,
  strokeStyle,
  edgeType,
  opacity,
  onChangeStrokeColor,
  onChangeStrokeWidth,
  onChangeStrokeStyle,
  onChangeEdgeType,
  onChangeOpacity,
}: MediaPanelProps) {
  return (
    <div className="flex flex-col gap-5">
      {/* 테두리 색상 */}
      <StrokeColorSection color={strokeColor} onChange={onChangeStrokeColor} />

      {/* 테두리 두께 */}
      <StrokeWidthSection
        strokeWidth={strokeWidth}
        onChange={onChangeStrokeWidth}
      />

      {/* 선 스타일 */}
      <StrokeStyleSection
        strokeStyle={strokeStyle}
        onChange={onChangeStrokeStyle}
      />

      {/* 모서리 */}
      <EdgesSection edgeType={edgeType} onChange={onChangeEdgeType} />

      {/* 투명도 */}
      <OpacitySection opacity={opacity} onChange={onChangeOpacity} />
    </div>
  );
}
