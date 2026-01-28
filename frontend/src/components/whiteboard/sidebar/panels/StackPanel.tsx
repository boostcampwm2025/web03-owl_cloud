'use client';

import OpacitySection from '@/components/whiteboard/sidebar/sections/OpacitySection';
import LayerSection, {
  LayerDirection,
} from '@/components/whiteboard/sidebar/sections/LayerSection';

interface StackPanelProps {
  src: string;
  stackName: string;
  category: string;
  opacity: number;
  onChangeOpacity: (opacity: number) => void;
  onChangeLayer: (direction: LayerDirection) => void;
}

export default function StackPanel({
  // src / stackName / category 는 현재 사용되지 않음
  src,
  stackName,
  category,
  opacity,
  onChangeOpacity,
  onChangeLayer,
}: StackPanelProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* 투명도 설정 */}
      <OpacitySection opacity={opacity} onChange={onChangeOpacity} />

      {/* 레이어 설정*/}
      <LayerSection onChangeLayer={onChangeLayer} />
    </div>
  );
}
