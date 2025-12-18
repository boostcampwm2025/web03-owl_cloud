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
      onDblClick={(e) => {
        setEditingNode(e.target as Konva.Text);
      }}
      onDblClick={(e) => {
        setEditingNode(e.target as Konva.Text);
      }}
      onDragEnd={(e) => {
        onChange({
          x: e.target.x(),
          y: e.target.y(),
        });
      }}
    />
  );
}
