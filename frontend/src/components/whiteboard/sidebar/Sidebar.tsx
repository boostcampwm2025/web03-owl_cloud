'use client';

import { useMemo } from 'react';

// 패널 컴포넌트들 임포트
import ShapePanel from '@/components/whiteboard/sidebar/panels/ShapePanel';
import ArrowPanel from '@/components/whiteboard/sidebar/panels/ArrowPanel';
import LinePanel from '@/components/whiteboard/sidebar/panels/LinePanel';
import TextPanel from '@/components/whiteboard/sidebar/panels/TextPanel';
import DrawingPanel from '@/components/whiteboard/sidebar/panels/DrawingPanel';

import { useCanvasStore } from '@/store/useCanvasStore';
import type {
  ArrowItem,
  LineItem,
  ShapeItem,
  TextItem,
  DrawingItem,
} from '@/types/whiteboard';
import {
  ARROW_SIZE_PRESETS,
  ARROW_STYLE_PRESETS,
} from '@/components/whiteboard/sidebar/panels/arrowPresets';
import { TEXT_SIZE_PRESETS } from '@/components/whiteboard/sidebar/panels/textPresets';
import { DRAWING_SIZE_PRESETS } from '@/constants/drawingPresets';
import {
  getArrowSize,
  getLineSize,
  getTextSize,
  getDrawingSize,
  getItemStyle,
} from '@/utils/sidebarStyleHelpers';

// 사이드 바 선택된 요소 타입
type SelectionType = 'shape' | 'arrow' | 'line' | 'text' | 'drawing' | null;

export default function Sidebar() {
  // 스토어에서 선택된 아이템 정보 가져오기
  const selectedId = useCanvasStore((state) => state.selectedId);
  const items = useCanvasStore((state) => state.items);
  const updateItem = useCanvasStore((state) => state.updateItem);
  const cursorMode = useCanvasStore((state) => state.cursorMode);
  const drawingStroke = useCanvasStore((state) => state.drawingStroke);
  const drawingSize = useCanvasStore((state) => state.drawingSize);
  const setDrawingStroke = useCanvasStore((state) => state.setDrawingStroke);
  const setDrawingSize = useCanvasStore((state) => state.setDrawingSize);

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
      case 'text':
        return 'text';
      case 'drawing':
        return 'drawing';
      default:
        return null;
    }
  };

  const selectionType = getSelectionType(selectedItem);

  // 선택 타입에 따른 표시될 헤더 제목
  const getHeaderTitle = () => {
    if (cursorMode === 'draw') return 'Drawing';

    switch (selectionType) {
      case 'shape':
        return 'Shape';
      case 'arrow':
        return 'Arrow';
      case 'line':
        return 'Line';
      case 'text':
        return 'Text';
      case 'drawing':
        return 'Drawing';
      default:
        return '';
    }
  };

  // 사이드바 표시 여부
  if (!(selectedItem && selectionType) && cursorMode !== 'draw') {
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

        {/* text */}
        {selectionType === 'text' && (
          <TextPanel
            fill={(selectedItem as TextItem).fill}
            size={getTextSize(selectedItem as TextItem)}
            align={(selectedItem as TextItem).align}
            fontStyle={(selectedItem as TextItem).fontStyle ?? 'normal'}
            textDecoration={(selectedItem as TextItem).textDecoration ?? 'none'}
            onChangeFill={(color) => updateItem(selectedId!, { fill: color })}
            onChangeSize={(size) => {
              const preset = TEXT_SIZE_PRESETS[size];
              updateItem(selectedId!, { fontSize: preset.fontSize });
            }}
            onChangeAlign={(align) => updateItem(selectedId!, { align })}
            onChangeFontStyle={(fontStyle) =>
              updateItem(selectedId!, { fontStyle })
            }
            onChangeTextDecoration={(textDecoration) =>
              updateItem(selectedId!, { textDecoration })
            }
          />
        )}
        {/* drawing */}
        {(cursorMode === 'draw' || selectionType === 'drawing') && (
          <DrawingPanel
            stroke={
              selectedItem && selectionType === 'drawing'
                ? (selectedItem as DrawingItem).stroke
                : drawingStroke
            }
            size={
              selectedItem && selectionType === 'drawing'
                ? getDrawingSize(selectedItem as DrawingItem)
                : drawingSize
            }
            onChangeStroke={(color) => {
              if (selectedItem && selectionType === 'drawing') {
                updateItem(selectedId!, { stroke: color });
              } else {
                setDrawingStroke(color);
              }
            }}
            onChangeSize={(size) => {
              if (selectedItem && selectionType === 'drawing') {
                const preset = DRAWING_SIZE_PRESETS[size];
                updateItem(selectedId!, { strokeWidth: preset.strokeWidth });
              } else {
                setDrawingSize(size);
              }
            }}
          />
        )}
      </div>
    </aside>
  );
}
