'use client';

import { useState } from 'react';

import { useCanvasStore } from '@/store/useCanvasStore';
import { useToolbarMode } from '@/hooks/useToolbarMode';
import { useAddWhiteboardItem } from '@/hooks/useAddWhiteboardItem';

import NavButton from '@/components/whiteboard/common/NavButton';

// Panel import
import ShapePanel from '@/components/whiteboard/toolbar/panels/ShapePanel';
import MediaPanel from '@/components/whiteboard/toolbar/panels/MediaPanel';
import StackPanel from '@/components/whiteboard/toolbar/panels/StackPanel';

// Icon import
// TODO : 필요한 아이콘 추가 : 화살표 / 기술 스택 아이콘 / line 아이콘
import { ImageIcon } from '@/assets/icons/common';
import {
  CursorIcon,
  HandIcon,
  TriangleIcon,
  LineIcon,
  ArrowIcon,
  PenIcon,
  TextBoxIcon,
  EraserIcon,
} from '@/assets/icons/whiteboard';

// Type import
import { ToolType, PanelType } from '@/types/whiteboard/whiteboardUI';

// Constants import
import { SHAPE_TOOLS, MEDIA_TOOLS } from '@/constants/whiteboard';

export default function ToolbarContainer() {
  // 상태 관리 로직
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [activePanel, setActivePanel] = useState<PanelType>(null);

  // 커서 모드 상태
  const cursorMode = useCanvasStore((state) => state.cursorMode);
  const setCursorMode = useCanvasStore((state) => state.setCursorMode);

  // 툴바 모드 전환 훅
  const { updateModeForTool, updateModeForPanel } = useToolbarMode();

  // 아이템 추가 훅
  const { handleAddText, handleAddArrow } = useAddWhiteboardItem();

  // 핸들러 로직
  // 하위 패널에서 구체적인 도구 선택
  const handleToolSelect = (tool: ToolType) => {
    setActiveTool(tool);
    setActivePanel(null);
    updateModeForTool(tool);
    // TODO: useWorkspaceStore.getState().setTool(tool);
  };

  // 메인 툴바 버튼을 눌렀을 때 (패널 토글/즉시 선택)
  const togglePanel = (panel: PanelType) => {
    setActivePanel((prev) => (prev === panel ? null : panel));
    updateModeForPanel(panel);
  };

  return (
    <div className="absolute top-4 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-2">
      <div className="flex items-center gap-1 rounded-lg border border-neutral-200 bg-white p-2 shadow-sm">
        <NavButton
          icon={CursorIcon}
          label="선택"
          isActive={activeTool === 'select'}
          onClick={() => handleToolSelect('select')}
          bgColor="bg-white"
          activeBgColor="bg-sky-100"
        />

        <NavButton
          icon={HandIcon}
          label="화면 이동"
          isActive={activeTool === 'move'}
          onClick={() => handleToolSelect('move')}
          bgColor="bg-white"
          activeBgColor="bg-sky-100"
        />

        <NavButton
          icon={EraserIcon}
          label="지우개"
          isActive={cursorMode === 'eraser'}
          onClick={() => {
            if (cursorMode === 'eraser') {
              setCursorMode('select');
              setActiveTool('select');
            } else {
              setCursorMode('eraser');
              setActiveTool('eraser');
              setActivePanel(null);
            }
          }}
          bgColor="bg-white"
          activeBgColor="bg-sky-100"
        />

        <div className="h-8 w-px bg-neutral-200" />

        <NavButton
          icon={PenIcon}
          label="그리기"
          isActive={cursorMode === 'draw'}
          onClick={() => {
            if (cursorMode === 'draw') {
              setCursorMode('select');
              setActiveTool('select');
            } else {
              setCursorMode('draw');
              setActiveTool('draw');
              setActivePanel(null);
            }
          }}
          bgColor="bg-white"
          activeBgColor="bg-sky-100"
        />

        <NavButton
          icon={TextBoxIcon}
          label="텍스트"
          onClick={() => {
            handleAddText();
            setCursorMode('select');
            setActiveTool('select');
          }}
          bgColor="bg-white"
          activeBgColor="bg-sky-100"
        />

        <NavButton
          icon={TriangleIcon}
          label="도형"
          isActive={SHAPE_TOOLS.includes(activeTool) || activePanel === 'shape'}
          onClick={() => togglePanel('shape')}
          bgColor="bg-white"
          activeBgColor="bg-neutral-100"
        />

        <NavButton
          icon={LineIcon}
          label="선"
          onClick={() => {
            setCursorMode('select');
            setActiveTool('select');
          }}
          bgColor="bg-white"
          activeBgColor="bg-sky-100"
        />

        <NavButton
          icon={ArrowIcon}
          label="화살표"
          onClick={() => {
            handleAddArrow();
            setCursorMode('select');
            setActiveTool('select');
          }}
          bgColor="bg-white"
          activeBgColor="bg-sky-100"
        />

        <NavButton
          icon={ImageIcon}
          label="미디어"
          isActive={MEDIA_TOOLS.includes(activeTool) || activePanel === 'media'}
          onClick={() => togglePanel('media')}
          bgColor="bg-white"
          activeBgColor="bg-neutral-100"
        />

        {/* <NavButton
          icon={StackIcon}
          label="아키텍처"
          isActive={STACK_TOOLS.includes(activeTool) || activePanel === 'stack'}
          onClick={() => togglePanel('stack')}
          bgColor="bg-white"
          activeBgColor="bg-sky-100 text-sky-600"
        /> */}
      </div>

      {activePanel === 'shape' && (
        <div className="absolute top-full mt-2">
          <ShapePanel selectedTool={activeTool} onSelect={handleToolSelect} />
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
