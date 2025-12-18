'use client';

import { Text } from 'react-konva';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { WorkspaceItem } from '@/types/workspace';
import Konva from 'konva';

interface TextItemProps {
  item: WorkspaceItem;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (attrs: Partial<WorkspaceItem>) => void;
}

export default function TextItem({ item, onSelect, onChange }: TextItemProps) {
  const { id, ...props } = item;

  const editingNode = useWorkspaceStore((s) => s.editingNode);
  const setEditingNode = useWorkspaceStore((s) => s.setEditingNode);

  const isEditing = editingNode?.id() === item.id;

  return (
    <Text
      key={id}
      id={id}
      {...props}
      visible={!isEditing}
      draggable
      onClick={onSelect}
      // 더블 클릭시 해당 텍스트를 editingNode로 설정
      onDblClick={(e) => {
        setEditingNode(e.target as Konva.Text);
      }}
      onDragEnd={(e) => {
        onChange({
          x: e.target.x(),
          y: e.target.y(),
        });
      }}
      // 박스 늘릴때 텍스트 늘어짐 보정
      // scale을 1로 초기화함
      onTransform={(e) => {
        const node = e.target;
        const scaleX = node.scaleX();
        const newWidth = Math.max(30, node.width() * scaleX);
        //
        node.setAttrs({
          width: newWidth,
          scaleX: 1,
          scaleY: 1,
        });
      }}
      // 최종 저장
      onTransformEnd={(e) => {
        const node = e.target;
        node.height();
        onChange({
          x: node.x(),
          y: node.y(),
          width: node.width(),
          rotation: node.rotation(),
        });
      }}
    />
  );
}
