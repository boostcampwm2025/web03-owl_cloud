'use client';

// 패널 컴포넌트들 임포트
import ShapePanel from '@/components/whiteboard/sidebar/panels/ShapePanel';
import ArrowPanel from '@/components/whiteboard/sidebar/panels/ArrowPanel';
import LinePanel from '@/components/whiteboard/sidebar/panels/LinePanel';
import MediaPanel from '@/components/whiteboard/sidebar/panels/MediaPanel';
import TextPanel from '@/components/whiteboard/sidebar/panels/TextPanel';
import DrawingPanel from '@/components/whiteboard/sidebar/panels/DrawingPanel';
import StackPanel from '@/components/whiteboard/sidebar/panels/StackPanel';

import { useWhiteboardSharedStore } from '@/store/useWhiteboardSharedStore';
import { useWhiteboardLocalStore } from '@/store/useWhiteboardLocalStore';
import { useItemActions } from '@/hooks/useItemActions';
import { StrokeStyleType } from '@/components/whiteboard/sidebar/sections/StrokeStyleSection';
import { EdgeType } from '@/components/whiteboard/sidebar/sections/EdgesSection';
import type {
  ArrowItem,
  LineItem,
  ShapeItem,
  ImageItem,
  TextItem,
  DrawingItem,
  StackItem,
} from '@/types/whiteboard';
import {
  ARROW_SIZE_PRESETS,
  ARROW_STYLE_PRESETS,
} from '@/constants/arrowPresets';
import { TEXT_SIZE_PRESETS } from '@/constants/textPresets';
import { DRAWING_SIZE_PRESETS } from '@/constants/drawingPresets';
import {
  getArrowSize,
  getLineSize,
  getTextSize,
  getDrawingSize,
  getItemStyle,
} from '@/utils/sidebarStyleHelpers';
import { LayerDirection } from '@/components/whiteboard/sidebar/sections/LayerSection';

// 사이드 바 선택된 요소 타입
type SelectionType =
  | 'shape'
  | 'arrow'
  | 'line'
  | 'text'
  | 'drawing'
  | 'media'
  | 'stack'
  | null;

export default function Sidebar() {
  // 스토어에서 선택된 아이템 정보 가져오기
  const selectedId = useWhiteboardLocalStore((state) => state.selectedId);
  const { updateItem, bringToFront, sendToBack, bringForward, sendBackward } =
    useItemActions();

  const cursorMode = useWhiteboardLocalStore((state) => state.cursorMode);
  const drawingStroke = useWhiteboardLocalStore((state) => state.drawingStroke);
  const drawingSize = useWhiteboardLocalStore((state) => state.drawingSize);
  const setDrawingStroke = useWhiteboardLocalStore(
    (state) => state.setDrawingStroke,
  );
  const setDrawingSize = useWhiteboardLocalStore(
    (state) => state.setDrawingSize,
  );

  // 선택된 아이템 찾기 - items 전체를 구독하지 않고 선택된 아이템만 가져오기
  const selectedItem = useWhiteboardSharedStore((state) =>
    state.items.find((item) => item.id === selectedId),
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
      case 'image':
      case 'video':
      case 'youtube':
        return 'media';
      case 'text':
        return 'text';
      case 'drawing':
        return 'drawing';
      case 'stack':
        return 'stack';
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
    if (cursorMode === 'draw') return 'Drawing';

    switch (selectionType) {
      case 'shape':
        return 'Shape';
      case 'arrow':
        return 'Arrow';
      case 'line':
        return 'Line';
      case 'media':
        if (selectedItem?.type === 'youtube') return 'Youtube';
        if (selectedItem?.type === 'video') return 'Video';
        return 'Image';
      case 'text':
        return 'Text';
      case 'drawing':
        return 'Drawing';
      case 'stack':
        return 'Stack';
      default:
        return '';
    }
  };

  // 사이드바 표시 여부
  if (!(selectedItem && selectionType) && cursorMode !== 'draw') {
    return null;
  }

  // 레이어 변경 핸들러
  const handleLayerChange = (direction: LayerDirection) => {
    if (!selectedId) return;

    switch (direction) {
      case 'front':
        bringToFront(selectedId);
        break;
      case 'back':
        sendToBack(selectedId);
        break;
      case 'forward':
        bringForward(selectedId);
        break;
      case 'backward':
        sendBackward(selectedId);
        break;
    }
  };

  return (
    <aside
      className="absolute top-1/2 left-2 z-5 flex w-60 -translate-y-1/2 flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white p-4 shadow-xl"
      style={{ maxHeight: 'calc(100vh - 220px)' }}
    >
      {/* Sidebar Title */}
      <div className="mb-2 shrink-0 border-b border-neutral-100 pb-2">
        <h2 className="text-lg font-bold text-neutral-800">
          {getHeaderTitle()}
        </h2>
      </div>

      {/* 패널 영역 */}
      <div className="min-h-0 flex-1 overflow-y-auto px-1 pr-2">
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
            onChangeLayer={handleLayerChange}
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
            onChangeLayer={handleLayerChange}
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
            onChangeLayer={handleLayerChange}
          />
        )}

        {/* media (image/video/youtube) */}
        {selectionType === 'media' && (
          <MediaPanel
            strokeColor={(selectedItem as ImageItem).stroke ?? 'transparent'}
            strokeWidth={(selectedItem as ImageItem).strokeWidth ?? 0}
            strokeStyle={getStrokeStyle(
              (selectedItem as ImageItem).dash,
              (selectedItem as ImageItem).strokeWidth ?? 0,
            )}
            edgeType={getEdgeType((selectedItem as ImageItem).cornerRadius)}
            opacity={(selectedItem as ImageItem).opacity ?? 1}
            onChangeStrokeColor={(color) =>
              updateItem(selectedId!, { stroke: color })
            }
            onChangeStrokeWidth={(width) => {
              const currentWidth = (selectedItem as ImageItem).strokeWidth ?? 0;
              const currentDash = (selectedItem as ImageItem).dash;

              const currentStyle = getStrokeStyle(
                currentDash,
                currentWidth || 2,
              );

              const newDash = getDashArray(currentStyle, width);

              updateItem(selectedId!, {
                strokeWidth: width,
                dash: newDash,
                stroke: (selectedItem as ImageItem).stroke ?? '#000000',
              });
            }}
            onChangeStrokeStyle={(style) => {
              const currentWidth = (selectedItem as ImageItem).strokeWidth ?? 0;

              // 보정된 두께
              // 두께가 0이면 내부적으로 2로 간주하여 dash 배열 계산
              const effectiveWidth = currentWidth === 0 ? 2 : currentWidth;

              updateItem(selectedId!, {
                // effectiveWidth로 dash 배열 계산
                dash: getDashArray(style, effectiveWidth),

                // 두께가 0이었다면 2px로 업데이트
                strokeWidth: effectiveWidth,

                // 색상이 없었다면 기본 색상 검정으로 설정
                stroke: (selectedItem as ImageItem).stroke ?? '#000000',
              });
            }}
            onChangeEdgeType={(type) => {
              updateItem(selectedId!, {
                cornerRadius: type === 'round' ? 20 : 0,
              });
            }}
            onChangeOpacity={(opacity) => {
              updateItem(selectedId!, { opacity });
            }}
            onChangeLayer={handleLayerChange}
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
            onChangeTextFormat={(format) =>
              updateItem(selectedId!, {
                fontStyle: format.fontStyle,
                textDecoration: format.textDecoration,
              })
            }
            onChangeLayer={handleLayerChange}
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
            onChangeLayer={selectedItem ? handleLayerChange : undefined}
          />
        )}

        {/* stack */}
        {selectionType === 'stack' && (
          <StackPanel
            src={(selectedItem as StackItem).src}
            stackName={(selectedItem as StackItem).stackName}
            category={(selectedItem as StackItem).category}
            opacity={(selectedItem as StackItem).opacity ?? 1}
            onChangeOpacity={(opacity) => {
              updateItem(selectedId!, { opacity });
            }}
            onChangeLayer={handleLayerChange}
          />
        )}
      </div>
    </aside>
  );
}
