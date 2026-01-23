'use client';

import StrokeColorSection from '@/components/whiteboard/sidebar/sections/StrokeColorSection';
import TextSizeSection from '@/components/whiteboard/sidebar/sections/text/TextSizeSection';
import TextAlignSection from '@/components/whiteboard/sidebar/sections/text/TextAlignSection';
import TextFormatSection from '@/components/whiteboard/sidebar/sections/text/TextFormatSection';
import type { TextSize } from '@/constants/textPresets';
import type { TextAlignment } from '@/types/whiteboard/base';
import LayerSection, {
  LayerDirection,
} from '@/components/whiteboard/sidebar/sections/LayerSection';

// TextPanel 컴포넌트
interface TextPanelProps {
  fill: string;
  size: TextSize;
  align: TextAlignment;
  fontStyle: string;
  textDecoration: string;
  onChangeFill: (color: string) => void;
  onChangeSize: (size: TextSize) => void;
  onChangeAlign: (align: TextAlignment) => void;
  onChangeFontStyle: (fontStyle: string) => void;
  onChangeTextDecoration: (textDecoration: string) => void;
  onChangeLayer: (direction: LayerDirection) => void;
}

export default function TextPanel({
  fill,
  size,
  align,
  fontStyle,
  textDecoration,
  onChangeFill,
  onChangeSize,
  onChangeAlign,
  onChangeFontStyle,
  onChangeTextDecoration,
  onChangeLayer,
}: TextPanelProps) {
  return (
    <div className="flex flex-col gap-2">
      {/* 텍스트 색상 설정 섹션 */}
      <StrokeColorSection
        title="Color"
        color={fill}
        onChange={onChangeFill}
        allowTransparent={false}
      />

      {/* 텍스트 크기 설정 섹션 */}
      <TextSizeSection size={size} onChangeSize={onChangeSize} />

      {/* 텍스트 정렬 설정 섹션 */}
      <TextAlignSection align={align} onChangeAlign={onChangeAlign} />

      {/* 텍스트 스타일 설정 섹션 */}
      <TextFormatSection
        fontStyle={fontStyle}
        textDecoration={textDecoration}
        onChangeFontStyle={onChangeFontStyle}
        onChangeTextDecoration={onChangeTextDecoration}
      />

      {/* 레이어 (Layer) */}
      <LayerSection onChangeLayer={onChangeLayer} />
    </div>
  );
}
