'use client';

import { useState } from 'react';

import NavButton from '@/components/whiteboard/common/NavButton';

// Panel import
import CursorPanel from '@/components/whiteboard/toolbar/panels/CursorPanel';
import ShapePanel from '@/components/whiteboard/toolbar/panels/ShapePanel';
import LinePanel from '@/components/whiteboard/toolbar/panels/LinePanel';
import ArrowPanel from '@/components/whiteboard/toolbar/panels/ArrowPanel';
import TextPanel from '@/components/whiteboard/toolbar/panels/TextPanel';
import MediaPanel from '@/components/whiteboard/toolbar/panels/MediaPanel';
import StackPanel from '@/components/whiteboard/toolbar/panels/StackPanel';

// Icon import
// TODO : 필요한 아이콘 추가 : 화살표 / 기술 스택 아이콘 / line 아이콘
import { ImageIcon } from '@/assets/icons/common';
import {
  CursorIcon,
  TriangleIcon,
  LineIcon,
  ArrowIcon,
  PenIcon,
  TextBoxIcon,
  EraserIcon,
} from '@/assets/icons/whiteboard';

// Type import
import { ToolType, PanelType } from '@/types/whiteboardUI';

// Constants import
import {
  CURSOR_TOOLS,
  SHAPE_TOOLS,
  LINE_TOOLS,
  ARROW_TOOLS,
  TEXT_TOOLS,
  MEDIA_TOOLS,
  STACK_TOOLS,
} from '@/constants/whiteboard';

export default function ToolbarContainer() {
  // 상태 관리 로직
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [activePanel, setActivePanel] = useState<PanelType>(null);

  // 핸들러 로직
  // 하위 패널에서 구체적인 도구 선택
  const handleToolSelect = (tool: ToolType) => {
    setActiveTool(tool);
    setActivePanel(null);
    // TODO: useWorkspaceStore.getState().setTool(tool);
  };

  // 메인 툴바 버튼을 눌렀을 때 (패널 토글/즉시 선택)
  const togglePanel = (panel: PanelType) => {
    setActivePanel((prev) => (prev === panel ? null : panel));
  };

  return (
    <div className="absolute top-4 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-2">
      <div className="flex items-center gap-1 rounded-lg border border-neutral-200 bg-white p-2 shadow-sm">
        <NavButton
          icon={CursorIcon}
          label="마우스 도구"
          isActive={
            CURSOR_TOOLS.includes(activeTool) || activePanel === 'cursor'
          }
          onClick={() => togglePanel('cursor')}
          bgColor="bg-white"
          activeBgColor="bg-sky-100 text-sky-600"
        />

        <NavButton
          icon={TriangleIcon}
          label="도형"
          isActive={SHAPE_TOOLS.includes(activeTool) || activePanel === 'shape'}
          onClick={() => togglePanel('shape')}
          bgColor="bg-white"
          activeBgColor="bg-sky-100 text-sky-600"
        />

        <NavButton
          icon={LineIcon}
          label="선"
          isActive={LINE_TOOLS.includes(activeTool) || activePanel === 'line'}
          onClick={() => togglePanel('line')}
          bgColor="bg-white"
          activeBgColor="bg-sky-100 text-sky-600"
        />

        <NavButton
          icon={ArrowIcon}
          label="화살표"
          isActive={ARROW_TOOLS.includes(activeTool) || activePanel === 'arrow'}
          onClick={() => togglePanel('arrow')}
          bgColor="bg-white"
          activeBgColor="bg-sky-100 text-sky-600"
        />

        <NavButton
          icon={PenIcon}
          label="그리기"
          isActive={activeTool === 'draw'}
          onClick={() => handleToolSelect('draw')}
          bgColor="bg-white"
          activeBgColor="bg-sky-100 text-sky-600"
        />

        <NavButton
          icon={TextBoxIcon}
          label="텍스트"
          isActive={TEXT_TOOLS.includes(activeTool) || activePanel === 'text'}
          onClick={() => togglePanel('text')}
          bgColor="bg-white"
          activeBgColor="bg-sky-100 text-sky-600"
        />

        <NavButton
          icon={ImageIcon}
          label="미디어"
          isActive={MEDIA_TOOLS.includes(activeTool) || activePanel === 'media'}
          onClick={() => togglePanel('media')}
          bgColor="bg-white"
          activeBgColor="bg-sky-100 text-sky-600"
        />

        {/* <NavButton
          icon={StackIcon}
          label="아키텍처"
          isActive={STACK_TOOLS.includes(activeTool) || activePanel === 'stack'}
          onClick={() => togglePanel('stack')}
          bgColor="bg-white"
          activeBgColor="bg-sky-100 text-sky-600"
        /> */}

        <NavButton
          icon={EraserIcon}
          label="지우개"
          isActive={activeTool === 'eraser'}
          onClick={() => handleToolSelect('eraser')}
          bgColor="bg-white"
          activeBgColor="bg-sky-100 text-sky-600"
        />
      </div>

      {activePanel === 'cursor' && (
        <div className="absolute top-full mt-2">
          <CursorPanel selectedTool={activeTool} onSelect={handleToolSelect} />
        </div>
      )}

      {activePanel === 'shape' && (
        <div className="absolute top-full mt-2">
          <ShapePanel selectedTool={activeTool} onSelect={handleToolSelect} />
        </div>
      )}

      {activePanel === 'line' && (
        <div className="absolute top-full mt-2">
          <LinePanel selectedTool={activeTool} onSelect={handleToolSelect} />
        </div>
      )}

      {activePanel === 'arrow' && (
        <div className="absolute top-full mt-2">
          <ArrowPanel selectedTool={activeTool} onSelect={handleToolSelect} />
        </div>
      )}

      {activePanel === 'text' && (
        <div className="absolute top-full mt-2">
          <TextPanel selectedTool={activeTool} onSelect={handleToolSelect} />
        </div>
      )}

      {activePanel === 'media' && (
        <div className="absolute top-full mt-2">
          <MediaPanel selectedTool={activeTool} onSelect={handleToolSelect} />
        </div>
      )}

      {/* {activePanel === 'stack' && (
        <div className="absolute top-full mt-2">
          <StackPanel
            selectedTool={activeTool}
            onSelect={(tool) => handleToolSelect(tool)}
          />
        </div>
      )} */}
    </div>
  );
}
