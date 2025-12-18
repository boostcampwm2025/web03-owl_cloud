'use client';

import { useAddText } from '@/hooks/useAddText';

export default function TextPanel() {
  const { handleAddText } = useAddText();

  return (
    <div className="scrollbar-thin scrollbar-thumb-gray-200 h-full w-80 overflow-y-auto bg-white p-5">
      <button
        // 텍스트 추가
        onClick={() => {
          handleAddText();
        }}
        className="mt-10 w-full rounded-md bg-lime-100 py-2 text-lg text-lime-600 hover:bg-lime-200"
      >
        텍스트 상자 추가
      </button>
    </div>
  );
}
