import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { WorkspaceItem } from '@/types/workspace';
import { v4 as uuidv4 } from 'uuid';

export function useAddText() {
  const addItem = useWorkspaceStore((state) => state.addItem);
  const cardData = useWorkspaceStore((state) => state.cardData);

  const handleAddText = () => {
    const newTextItem: WorkspaceItem = {
      id: uuidv4(),
      type: 'text',
      text: '텍스트를 입력하세요.',
      fontSize: 24,
      fontFamily: 'Arial',
      fill: '#000000',
      fontStyle: 'normal',
      textDecoration: '',
      align: 'center',
      x: cardData.workspaceWidth / 2,
      y: cardData.workspaceHeight / 2,
      width: 200,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      zIndex: cardData.items.length,
      wrap: 'char',
    };

    addItem(newTextItem);
  };

  return { handleAddText };
}
