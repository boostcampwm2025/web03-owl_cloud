'use client';

import StrokeColorSection from '@/components/whiteboard/sidebar/sections/StrokeColorSection';
import BackgroundColorSection from '@/components/whiteboard/sidebar/sections/BackgroundColorSection';
import StrokeWidthSection from '@/components/whiteboard/sidebar/sections/StrokeWidthSection';
import StrokeStyleSection, {
  StrokeStyleType,
} from '@/components/whiteboard/sidebar/sections/StrokeStyleSection';
import EdgesSection, {
  EdgeType,
} from '@/components/whiteboard/sidebar/sections/EdgesSection';
import OpacitySection from '@/components/whiteboard/sidebar/sections/OpacitySection';

interface ShapePanelProps {
  strokeColor: string;
  backgroundColor: string;
  strokeWidth: number;
  strokeStyle: StrokeStyleType;
  edgeType: EdgeType;
  opacity: number;

  onChangeStrokeColor: (color: string) => void;
  onChangeBackgroundColor: (color: string) => void;
  onChangeStrokeWidth: (width: number) => void;
  onChangeStrokeStyle: (style: StrokeStyleType) => void;
  onChangeEdgeType: (type: EdgeType) => void;
  onChangeOpacity: (opacity: number) => void;
}

export default function ShapePanel({
  strokeColor,
  backgroundColor,
  strokeWidth,
  strokeStyle,
  edgeType,
  opacity,
  onChangeStrokeColor,
  onChangeBackgroundColor,
  onChangeStrokeWidth,
  onChangeStrokeStyle,
  onChangeEdgeType,
  onChangeOpacity,
}: ShapePanelProps) {
  return (
    <div className="flex flex-col gap-5">
      {/* 테두리 색상 */}
      <StrokeColorSection color={strokeColor} onChange={onChangeStrokeColor} />

      {/* 배경 색상 */}
      <BackgroundColorSection
        color={backgroundColor}
        onChange={onChangeBackgroundColor}
      />
      {/* 테두리 두께 */}
      <StrokeWidthSection
        strokeWidth={strokeWidth}
        onChange={onChangeStrokeWidth}
      />

      {/* 선 스타일 (Stroke style) */}
      <StrokeStyleSection
        strokeStyle={strokeStyle}
        onChange={onChangeStrokeStyle}
      />

      {/* 모서리 (Edges) */}
      <EdgesSection edgeType={edgeType} onChange={onChangeEdgeType} />

      {/* 투명도 (Opacity) */}
      <OpacitySection opacity={opacity} onChange={onChangeOpacity} />
    </div>
  );
}
