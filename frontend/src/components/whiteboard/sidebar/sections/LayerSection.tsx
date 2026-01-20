'use client';

import Section from '@/components/whiteboard/sidebar/ui/Section';
import NavButton from '@/components/whiteboard/common/NavButton';
import {
  layerBringForwardIcon,
  layerBringToFrontIcon,
  layerSendBackwardIcon,
  layerSendToBackIcon,
} from '@/assets/icons/whiteboard/common';

export type LayerDirection = 'front' | 'back' | 'forward' | 'backward';

interface LayerSectionProps {
  onChangeLayer: (direction: LayerDirection) => void;
}

export default function LayerSection({ onChangeLayer }: LayerSectionProps) {
  return (
    <Section title="Layer">
      <div className="flex items-center justify-between gap-2 rounded border border-neutral-200 bg-white p-1">
        {/* 맨 뒤로 (가장 아래) */}
        <NavButton
          icon={layerSendToBackIcon}
          label="맨 뒤로"
          onClick={() => onChangeLayer('back')}
        />

        {/* 한 단계 뒤로 */}
        <NavButton
          icon={layerSendBackwardIcon}
          label="뒤로"
          onClick={() => onChangeLayer('backward')}
        />

        {/* 한 단계 앞으로 */}
        <NavButton
          icon={layerBringForwardIcon}
          label="앞으로"
          onClick={() => onChangeLayer('forward')}
        />

        {/* 맨 앞으로 (가장 위) */}
        <NavButton
          icon={layerBringToFrontIcon}
          label="맨 앞으로"
          onClick={() => onChangeLayer('front')}
        />
      </div>
    </Section>
  );
}
