'use client';

import { useMemo } from 'react';

// 패널 컴포넌트들 임포트
import ShapePanel from '@/components/whiteboard/sidebar/panels/ShapePanel';
import ArrowPanel from '@/components/whiteboard/sidebar/panels/ArrowPanel';
import LinePanel from '@/components/whiteboard/sidebar/panels/LinePanel';

import { useCanvasStore } from '@/store/useCanvasStore';
import type { ArrowItem, LineItem, ShapeItem } from '@/types/whiteboard';
import {
  ARROW_SIZE_PRESETS,
  ARROW_STYLE_PRESETS,
} from '@/components/whiteboard/sidebar/panels/arrowPresets';
import {
  getArrowSize,
  getLineSize,
  getItemStyle,
} from '@/utils/arrowPanelHelpers';

// 사이드 바 선택된 요소 타입
type SelectionType = 'shape' | 'arrow' | 'line' | null;

export default function Sidebar() {
  // 스토어에서 선택된 아이템 정보 가져오기
  const selectedId = useCanvasStore((state) => state.selectedId);
  const items = useCanvasStore((state) => state.items);
  const updateItem = useCanvasStore((state) => state.updateItem);

  // 선택된 아이템 찾기
  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedId),
    [items, selectedId],
  );

  // 선택된 아이템의 타입 결정
  const getSelectionType = (item: typeof selectedItem): SelectionType => {
    if (!item) return null;
    switch (item.type) {
      case 'shape':
        return 'shape';
      case 'arrow':
        return 'arrow';
      case 'line':
        return 'line';
      default:
        return null;
    }
  };

  const selectionType = getSelectionType(selectedItem);

  // 선택 타입에 따른 표시될 헤더 제목
  const getHeaderTitle = () => {
    switch (selectionType) {
      case 'shape':
        return 'Shape';
      case 'arrow':
        return 'Arrow';
      case 'line':
        return 'Line';
      default:
        return '';
    }
  };

  // 선택된 아이템이 없으면 사이드바 표시 안 함
  if (!selectedItem) {
    return null;
  }

  return (
    <aside className="absolute top-1/2 left-2 z-1 flex max-h-[calc(100vh-2rem)] w-56 -translate-y-1/2 flex-col overflow-y-auto rounded-lg border border-neutral-200 bg-white p-4 shadow-xl">
      {/* Sidebar Title */}
      <div className="mb-1">
        <h2 className="text-lg font-bold text-neutral-800">
          {getHeaderTitle()}
        </h2>
      </div>

      {/* 패널 영역 */}
      <div className="flex-1">
        {/* shape */}
        {selectionType === 'shape' && (
          <ShapePanel
            strokeColor={(selectedItem as ShapeItem).stroke}
            backgroundColor={(selectedItem as ShapeItem).fill}
            onChangeStrokeColor={(color) =>
              updateItem(selectedId!, { stroke: color })
            }
            onChangeBackgroundColor={(color) =>
              updateItem(selectedId!, { fill: color })
            }
          />
        )}

        {/* arrow */}
        {selectionType === 'arrow' && (
          <ArrowPanel
            stroke={(selectedItem as ArrowItem).stroke}
            size={getArrowSize(selectedItem as ArrowItem)}
            style={getItemStyle(selectedItem as ArrowItem)}
            startHeadType={(selectedItem as ArrowItem).startHeadType ?? 'none'}
            endHeadType={(selectedItem as ArrowItem).endHeadType ?? 'triangle'}
            onChangeStroke={(color) =>
              updateItem(selectedId!, { stroke: color })
            }
            onChangeSize={(size) => {
              const preset = ARROW_SIZE_PRESETS[size];
              updateItem(selectedId!, {
                strokeWidth: preset.strokeWidth,
                pointerLength: preset.pointerSize,
                pointerWidth: preset.pointerSize,
              });
            }}
            onChangeStyle={(style) => {
              updateItem(selectedId!, { tension: ARROW_STYLE_PRESETS[style] });
            }}
            onChangeStartHeadType={(type) => {
              updateItem(selectedId!, { startHeadType: type });
            }}
            onChangeEndHeadType={(type) => {
              updateItem(selectedId!, { endHeadType: type });
            }}
          />
        )}

        {/* line */}
        {selectionType === 'line' && (
          <LinePanel
            stroke={(selectedItem as LineItem).stroke}
            size={getLineSize(selectedItem as LineItem)}
            style={getItemStyle(selectedItem as LineItem)}
            onChangeStroke={(color) =>
              updateItem(selectedId!, { stroke: color })
            }
            onChangeSize={(size) => {
              const preset = ARROW_SIZE_PRESETS[size];
              updateItem(selectedId!, {
                strokeWidth: preset.strokeWidth,
              });
            }}
            onChangeStyle={(style) => {
              updateItem(selectedId!, { tension: ARROW_STYLE_PRESETS[style] });
            }}
          />
        )}
      </div>
    </aside>
  );
}
