'use client';

import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import TextToolbar from './TextToolbar';

export default function ToolbarManager() {
  const cardData = useWorkspaceStore((state) => state.cardData);
  const selectedId = useWorkspaceStore((state) => state.selectedId);
  const updateItem = useWorkspaceStore((state) => state.updateItem);

  const selectedItem = cardData.items.find((item) => item.id === selectedId);

  if (!selectedItem) return null;

  let toolbarContent: React.ReactNode = null;

  switch (selectedItem.type) {
    case 'text':
      toolbarContent = (
        <TextToolbar
          selectedText={selectedItem}
          onUpdate={(attr, value) =>
            updateItem(selectedItem.id, { [attr]: value })
          }
        />
      );
      break;

    default:
      return null;
  }

  return (
    <div className="absolute top-4 left-1/2 z-50 -translate-x-1/2">
      {toolbarContent}
    </div>
  );
}
