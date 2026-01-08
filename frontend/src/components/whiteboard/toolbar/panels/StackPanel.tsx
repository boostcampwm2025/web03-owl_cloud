'use client';

import { PanelProps } from '@/types/whiteboardUI';

// Stack 아이콘 관련
// import { STACK_LIST } from '@/constants/stackList';

export default function StackPanel({ selectedTool, onSelect }: PanelProps) {
  const handleStackClick = (stackId: string) => {
    onSelect('stack');

    // TODO: 전역 스토어(useWorkspaceStore)에 현재 선택된 activeStackId 저장
    // useWorkspaceStore.getState().setActiveStack(stackId);
  };

  return (
    <div className="flex w-64 flex-wrap gap-1 rounded-lg border border-neutral-200 bg-white p-2 shadow-lg">
      {/* {STACK_LIST.map((stack) => {
        const Icon = stack.icon;

        const isSelected = selectedTool === 'stack';

        return (
          <button
            key={stack.id}
            onClick={() => handleStackClick(stack.id)}
            title={stack.label}
            className={`flex h-9 w-9 items-center justify-center rounded-md border border-transparent transition-colors hover:border-sky-100 hover:bg-sky-50 ${
              isSelected ? 'text-neutral-800' : 'text-neutral-600'
            }`}
          >
            <Icon className="h-6 w-6" />
          </button>
        );
      })} */}
    </div>
  );
}
