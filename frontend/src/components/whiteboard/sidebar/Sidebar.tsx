'use client';

import { useMemo } from 'react';

// 패널 컴포넌트들 임포트
import ShapePanel from '@/components/whiteboard/sidebar/panels/ShapePanel';
import ArrowPanel from '@/components/whiteboard/sidebar/panels/ArrowPanel';
import LinePanel from '@/components/whiteboard/sidebar/panels/LinePanel';

import { StrokeStyleType } from '@/components/whiteboard/sidebar/sections/StrokeStyleSection';
import { EdgeType } from '@/components/whiteboard/sidebar/sections/EdgesSection';

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

  // Dash 배열([10, 5]) -> 스타일 문자열('dashed')
  const getStrokeStyle = (
    dash: number[] | undefined,
    width: number,
  ): StrokeStyleType => {
    if (!dash || dash.length === 0) return 'solid';
    // 점선 패턴이 짧으면(두께와 비슷하면) dotted로 간주
    if (dash[0] <= width * 1.5) return 'dotted';
    return 'dashed';
  };

  // 스타일 문자열 -> Dash 배열 계산
  const getDashArray = (style: StrokeStyleType, width: number): number[] => {
    switch (style) {
      case 'solid':
        return [];
      case 'dashed':
        return [width * 4, width * 2];
      case 'dotted':
        return [width, width];
      default:
        return [];
    }
  };

  // CornerRadius 숫자(20) -> 엣지 타입('round')
  const getEdgeType = (radius: number | undefined): EdgeType => {
    return radius && radius > 0 ? 'round' : 'sharp';
  };

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

  // 선택된 아이템이 없거나 지원하지 않는 타입이면 사이드바 표시 안 함
  if (!selectedItem || !selectionType) {
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
            // 테두리 색상
            strokeColor={(selectedItem as ShapeItem).stroke ?? '#000000'}
            // 배경 색상
            backgroundColor={(selectedItem as ShapeItem).fill ?? 'transparent'}
            // 테두리 두께
            strokeWidth={(selectedItem as ShapeItem).strokeWidth ?? 2}
            // 선 스타일
            strokeStyle={getStrokeStyle(
              (selectedItem as ShapeItem).dash,
              (selectedItem as ShapeItem).strokeWidth ?? 2,
            )}
            // 투명도
            opacity={(selectedItem as ShapeItem).opacity ?? 1}
            // 모서리 타입
            edgeType={getEdgeType((selectedItem as ShapeItem).cornerRadius)}
            // 테두리 색상 변경
            onChangeStrokeColor={(color) =>
              updateItem(selectedId!, { stroke: color })
            }
            // 배경 색상 변경 핸들러 연결
            onChangeBackgroundColor={(color) =>
              updateItem(selectedId!, { fill: color })
            }
            // 테두리 두께 변경 (두께가 바뀌면 점선 간격 비율에 맞게 재계산)
            onChangeStrokeWidth={(width) => {
              const currentItem = selectedItem as ShapeItem;
              const currentStyle = getStrokeStyle(
                currentItem.dash,
                currentItem.strokeWidth ?? 2,
              );
              // 스타일 유지하면서 새로운 두께에 맞는 dash 배열 생성
              const newDash = getDashArray(currentStyle, width);

              updateItem(selectedId!, {
                strokeWidth: width,
                dash: newDash,
              });
            }}
            // 선 스타일 변경 (solid, dashed, dotted)
            onChangeStrokeStyle={(style) => {
              const width = (selectedItem as ShapeItem).strokeWidth ?? 2;
              updateItem(selectedId!, { dash: getDashArray(style, width) });
            }}
            // 모서리 변경 (sharp, round)
            onChangeEdgeType={(type) => {
              // round : 20
              // sharp : 0
              updateItem(selectedId!, {
                cornerRadius: type === 'round' ? 20 : 0,
              });
            }}
            // 투명도 변경
            onChangeOpacity={(opacity) => {
              updateItem(selectedId!, { opacity });
            }}
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
