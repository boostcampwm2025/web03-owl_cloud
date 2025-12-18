import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { WorkspaceItem } from '@/types/workspace';

export function useAddText() {
  const addItem = useWorkspaceStore((state) => state.addItem);

  const handleAddText = () => {
    const newTextItem: WorkspaceItem = {
      id: crypto.randomUUID(),
      type: 'text',
      text: '텍스트를 입력하세요.',
      fontSize: 24,
      fontFamily: 'Arial',
      fill: '#000000',
      fontStyle: 'normal',
      textDecoration: '',
      align: 'center',
      x: 500,
      y: 250,
      width: 200,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      wrap: 'char',
    };

    addItem(newTextItem);
  };

  return { handleAddText };
}
