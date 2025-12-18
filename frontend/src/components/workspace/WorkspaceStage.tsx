'use client';

import { useRef, useEffect, useState } from 'react';
import Konva from 'konva';
import { Stage, Layer, Rect, Transformer } from 'react-konva';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import TextArea from './text/TextArea';

import RenderItem from './items/RenderItem';

export default function WorkspaceStage() {
  // Store 상태 및 액션
  const cardData = useWorkspaceStore((state) => state.cardData);
  const selectedId = useWorkspaceStore((state) => state.selectedId);
  const zoom = useWorkspaceStore((state) => state.zoom);
  const removeItem = useWorkspaceStore((state) => state.removeItem);
  const selectItem = useWorkspaceStore((state) => state.selectItem);
  const updateItem = useWorkspaceStore((state) => state.updateItem);
  const editingNode = useWorkspaceStore((state) => state.editingNode);
  const setEditingNode = useWorkspaceStore((state) => state.setEditingNode);

  // 접근 Ref 설정 (stage : 워크스페이스 / transformer : 선택 및 변형 도구)
  const stageRef = useRef<Konva.Stage | null>(null);
  const transformerRef = useRef<Konva.Transformer | null>(null);

  const selectedItem = cardData.items.find((item) => item.id === selectedId);
  const isTextSelected = selectedItem?.type === 'text';

  // Hydration 방지용
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // 추후에 수정이 필요하신경우 참고 부탁드립니다.
    // ESLint에서 잘못 탐지 하는 부분(하단에 ESLint 주석 넣은 이유)
    // useEffect에서 setState 호출하면 무한루프에 빠질 수도 있다고 경고하는부분인데
    // 이 부분은 컴포넌트가 처음 마운트 될 때만 실행되므로 문제 없음(무한루프 발생하지 않음) : 정상 작동함
    // eslint-disable-next-line react-hooks/exhaustive-deps
    setMounted(true);
  }, []);

  useEffect(() => {
    // mount 안되어 있거나 ref 연결 없으면 종료
    if (mounted && transformerRef.current && stageRef.current) {
      const stage = stageRef.current;

      // 아이템 선택 확인
      if (selectedId) {
        // 아이템 노드 찾기
        const selectedNode = stage.findOne('#' + selectedId);

        // 찾으면 transformer node 배열 추가 후 화면 갱신
        // 못찾으면 빈 배열
        if (selectedNode) {
          transformerRef.current?.nodes([selectedNode]);
          transformerRef.current?.getLayer()?.batchDraw();
        } else {
          transformerRef.current?.nodes([]);
        }
      } else {
        // 선택된게 없으면 빈배열
        transformerRef.current.nodes([]);
      }
    }
  }, [selectedId, cardData.items, mounted]);

  // 아이템 삭제 로직 : Delete,Backspace 키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 아이템 선택
      if (!selectedId || editingNode) return;

      // 키 감지
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Text의 경우 입력 중인 경우 방지
        // const activeElement = document.activeElement?.tagName;
        e.preventDefault();
        removeItem(selectedId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedId, removeItem, editingNode]);

  // 선택 해제
  const handleCheckDeselect = (
    e: Konva.KonvaEventObject<MouseEvent | TouchEvent>,
  ) => {
    // 선택 대상이 스테이지인 경우(하단 워크스페이스가 bg-rect)
    if (editingNode) return;
    const clickedOnEmpty =
      e.target === e.target.getStage() || e.target.hasName('bg-rect');

    // 선택 해제
    if (clickedOnEmpty) {
      selectItem(null);
    }
  };

  if (!mounted) return null;

  return (
    <div className="relative bg-white shadow-2xl">
      <Stage
        width={cardData.workspaceWidth * zoom}
        height={cardData.workspaceHeight * zoom}
        scaleX={zoom}
        scaleY={zoom}
        onMouseDown={handleCheckDeselect}
        onTouchStart={handleCheckDeselect}
        ref={stageRef}
        className="bg-white"
      >
        <Layer>
          {/* 워크스페이스 */}
          <Rect
            name="bg-rect"
            x={0}
            y={0}
            width={cardData.workspaceWidth}
            height={cardData.workspaceHeight}
            fill={cardData.backgroundColor}
            // 클릭 이벤트 확인
            listening={true}
          />

          {/* 아이템 렌더링 */}
          {cardData.items.map((item) => (
            <RenderItem
              key={item.id}
              item={item}
              isSelected={item.id === selectedId}
              onSelect={selectItem}
              onChange={(newAttributes) => updateItem(item.id, newAttributes)}
            />
          ))}

          {/* 요소 클릭시 뜨는 크기 조절 바
          Text 일때는 좌 우 조절바만 띄움*/}
          <Transformer
            ref={transformerRef}
            enabledAnchors={
              isTextSelected
                ? ['middle-left', 'middle-right']
                : [
                    'top-left',
                    'top-right',
                    'bottom-left',
                    'bottom-right',
                    'top-center',
                    'bottom-center',
                    'middle-left',
                    'middle-right',
                  ]
            }
            anchorSize={10}
            anchorCornerRadius={5}
            anchorStrokeWidth={1.5}
            anchorStroke="#65a30d"
            borderStroke="#65a30d"
            borderStrokeWidth={1.5}
            // 회전시 해당 각도 부근은 정렬 잘되도록
            rotationSnaps={[0, 90, 180, 270]}
            rotationSnapTolerance={10}
            keepRatio={false}
            // 박스 최소 너비
            boundBoxFunc={(oldBox, newBox) => {
              newBox.width = Math.max(30, newBox.width);
              return newBox;
            }}
          />
        </Layer>
      </Stage>

      {editingNode && (
        <TextArea
          textNode={editingNode}
          onChange={(newText) => {
            updateItem(editingNode.id(), {
              text: newText,
            });
          }}
          onClose={() => {
            setEditingNode(null);
            selectItem(null);
          }}
        />
      )}
    </div>
  );
}
