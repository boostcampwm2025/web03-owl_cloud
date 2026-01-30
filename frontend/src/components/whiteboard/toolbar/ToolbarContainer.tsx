'use client';

import { useState, useRef, useEffect } from 'react';

import { useWhiteboardLocalStore } from '@/store/useWhiteboardLocalStore';
import { useAddWhiteboardItem } from '@/hooks/useAddWhiteboardItem';
import { useClickOutside } from '@/hooks/useClickOutside';

import NavButton from '@/components/whiteboard/common/NavButton';

// Panel import
import ShapePanel from '@/components/whiteboard/toolbar/panels/ShapePanel';
import StackPanel from '@/components/whiteboard/toolbar/panels/StackPanel';

// Icon import
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
  StackIcon,
} from '@/assets/icons/whiteboard';

// Type import
import { ToolType, PanelType } from '@/types/whiteboard/whiteboardUI';
import { CursorMode } from '@/types/whiteboard/base';

// Constants import
import { SHAPE_TOOLS, STACK_TOOLS } from '@/constants/whiteboard';

export default function ToolbarContainer() {
  // 상태 관리 로직
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [activePanel, setActivePanel] = useState<PanelType>(null);
  const [panelLeft, setPanelLeft] = useState<number>(0);

  const toolbarRef = useRef<HTMLDivElement>(null);

  // 커서 모드 상태
  const cursorMode = useWhiteboardLocalStore((state) => state.cursorMode);

  useEffect(() => {
    setActiveTool(cursorMode);
  }, [cursorMode]);

  // 아이템 추가 훅
  const { handleAddText, handleAddArrow, handleAddLine, handleAddImage } =
    useAddWhiteboardItem();

  // 외부 클릭 시 패널 닫기
  useClickOutside(toolbarRef, () => setActivePanel(null), !!activePanel);

  // 토글 모드 (같은 모드면(버튼 다시 눌렀을때) select로, 아니면 해당 모드로)
  const toggleCursorMode = (mode: CursorMode) => {
    const { cursorMode, setCursorMode } = useWhiteboardLocalStore.getState();
    if (cursorMode === mode) {
      setActiveTool('select');
      setCursorMode('select');
    } else {
      setActiveTool(mode);
      setCursorMode(mode);
    }
    setActivePanel(null);
  };

  // 패널 토글 + select 모드로 전환
  const togglePanelWithSelect = (
    panel: PanelType,
    e: React.MouseEvent<HTMLButtonElement>,
  ) => {
    togglePanel(panel, e);
    const { setCursorMode } = useWhiteboardLocalStore.getState();
    setCursorMode('select');
    setActiveTool('select');
  };

  // 아이템 추가 후 select 모드로 전환
  const handleAddItem = (addFn: () => void) => {
    addFn();
    toggleCursorMode('select');
  };

  // 메인 툴바 버튼을 눌렀을 때 (패널 토글/즉시 선택)
  const togglePanel = (
    panel: PanelType,
    e: React.MouseEvent<HTMLButtonElement>,
  ) => {
    // 패널 위치 계산 (버튼 중앙 기준)
    const buttonRect = e.currentTarget.getBoundingClientRect();
    const toolbarContainer = e.currentTarget.parentElement;

    if (toolbarContainer) {
      const toolbarRect = toolbarContainer.getBoundingClientRect();
      const centerX = buttonRect.left + buttonRect.width / 2 - toolbarRect.left;
      setPanelLeft(centerX);
    }

    setActivePanel((prev) => (prev === panel ? null : panel));
  };

  return (
    <div
      ref={toolbarRef}
      className="absolute top-4 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-2 select-none"
    >
      <div className="flex items-center gap-1 rounded-lg border border-neutral-200 bg-white p-2 shadow-sm">
        <NavButton
          icon={CursorIcon}
          label="선택 (V)"
          isActive={activeTool === 'select'}
          onClick={() => toggleCursorMode('select')}
          bgColor="bg-white"
          hvColor="bg-neutral-100"
          activeBgColor="bg-sky-200"
        />

        <NavButton
          icon={HandIcon}
          label="화면 이동 (H)"
          isActive={activeTool === 'move'}
          onClick={() => toggleCursorMode('move')}
          bgColor="bg-white"
          hvColor="bg-neutral-100"
          activeBgColor="bg-sky-200"
        />

        <NavButton
          icon={TriangleIcon}
          label="도형"
          isActive={SHAPE_TOOLS.includes(activeTool) || activePanel === 'shape'}
          onClick={(e) => togglePanelWithSelect('shape', e)}
          bgColor="bg-white"
          hvColor="bg-neutral-100"
          activeBgColor="bg-neutral-200"
        />

        <NavButton
          icon={ArrowIcon}
          label="화살표"
          onClick={() => handleAddItem(handleAddArrow)}
          bgColor="bg-white"
          hvColor="bg-neutral-100"
        />

        <NavButton
          icon={LineIcon}
          label="선"
          onClick={() => handleAddItem(handleAddLine)}
          bgColor="bg-white"
          hvColor="bg-neutral-100"
        />

        <NavButton
          icon={PenIcon}
          label="그리기"
          isActive={cursorMode === 'draw'}
          onClick={() => toggleCursorMode('draw')}
          bgColor="bg-white"
          hvColor="bg-neutral-100"
          activeBgColor="bg-sky-200"
        />

        <NavButton
          icon={TextBoxIcon}
          label="텍스트"
          onClick={() => handleAddItem(handleAddText)}
          bgColor="bg-white"
          hvColor="bg-neutral-100"
        />

        <NavButton
          icon={ImageIcon}
          label="이미지"
          onClick={() => handleAddItem(handleAddImage)}
          bgColor="bg-white"
          hvColor="bg-neutral-100"
        />

        <NavButton
          icon={StackIcon}
          label="아키텍처"
          isActive={STACK_TOOLS.includes(activeTool) || activePanel === 'stack'}
          onClick={(e) => togglePanelWithSelect('stack', e)}
          bgColor="bg-white"
          hvColor="bg-neutral-100"
          activeBgColor="bg-neutral-200"
        />

        <NavButton
          icon={EraserIcon}
          label="지우개"
          isActive={cursorMode === 'eraser'}
          onClick={() => toggleCursorMode('eraser')}
          bgColor="bg-white"
          hvColor="bg-neutral-100"
          activeBgColor="bg-sky-200"
        />
      </div>

      {/* 하단 패널 렌더링 영역 */}
      {activePanel && (
        <div
          className="absolute top-full mt-2"
          style={{ left: `${panelLeft}px`, transform: 'translateX(-50%)' }}
        >
          {activePanel === 'shape' && (
            <ShapePanel
              selectedTool={activeTool}
              onSelect={() => {
                toggleCursorMode('select');
                setActivePanel(null);
              }}
            />
          )}

          {activePanel === 'stack' && (
            <StackPanel
              selectedTool={activeTool}
              onSelect={() => {
                toggleCursorMode('select');
                setActivePanel(null);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
