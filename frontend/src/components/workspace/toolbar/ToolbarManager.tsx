'use client';

import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import TextToolbar from './TextToolbar';

export default function ToolbarManager() {
  const cardData = useWorkspaceStore((state) => state.cardData);
  const selectedId = useWorkspaceStore((state) => state.selectedId);
  const updateItem = useWorkspaceStore((state) => state.updateItem);
  const selectedItem = cardData.items.find((item) => item.id === selectedId);

  if (!selectedItem) return null;

  switch (selectedItem.type) {
    case 'text':
      return (
        <TextToolbar
          selectedText={selectedItem}
          onUpdate={(attr, value) =>
            updateItem(selectedItem.id, { [attr]: value })
          }
        />
      );
    default:
      return null;
  }
}
