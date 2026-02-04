'use client';

import { useState, useMemo, useRef, WheelEvent } from 'react';
import Image from 'next/image';

import {
  STACK_LIST,
  StackCategory,
  StackIconInfo,
} from '@/constants/stackList';

import { useAddWhiteboardItem } from '@/hooks/useAddWhiteboardItem';
import { PanelProps } from '@/types/whiteboard/whiteboardUI';
import { SearchIcon } from '@/assets/icons/whiteboard';

export default function StackPanel({
  selectedTool,
  onSelect,
}: Partial<PanelProps>) {
  // stack add hook
  const { handleAddStack } = useAddWhiteboardItem();

  // 검색용 상태
  const [activeCategory, setActiveCategory] = useState<StackCategory | 'all'>(
    'all',
  );
  const [searchQuery, setSearchQuery] = useState('');

  // 카테고리 영역 참조 Ref
  const scrollRef = useRef<HTMLDivElement>(null);

  // 마우스 휠 -> 가로 스크롤 변환 : 카테고리 탭 스크롤용
  const handleWheel = (e: WheelEvent) => {
    if (scrollRef.current) scrollRef.current.scrollLeft += e.deltaY;
  };

  // 필터링 아이콘 리스트
  const filteredIcons = useMemo(() => {
    return STACK_LIST.filter((icon: StackIconInfo) => {
      const matchesSearch = icon.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      const matchesCategory =
        activeCategory === 'all' || icon.category === activeCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory]);

  // 카테고리 목록
  const categories: (StackCategory | 'all')[] = [
    'all',
    'ai',
    'frontend',
    'backend',
    'database',
    'devops',
    'mobile',
    'desktop',
    'game',
    'language',
    'hardware',
    'tool',
  ];

  const handleIconClick = (icon: StackIconInfo) => {
    // 화이트보드에 아이콘 추가
    handleAddStack(icon);

    // 패널 닫기 (부모의 선택 상태를 null로 변경)
    if (onSelect) onSelect(null);
  };

  return (
    <div className="flex max-w-100 min-w-95 flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-3 shadow-2xl">
      {/* 상단 검색 바 */}
      <div className="relative">
        <div className="absolute top-1/2 left-3 -translate-y-1/2 text-neutral-500">
          <SearchIcon size={16} />
        </div>
        <input
          type="text"
          placeholder="Search Stack..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-neutral-300 bg-neutral-100 py-1.5 pr-4 pl-9 text-xs placeholder-neutral-600 transition-all outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
        />
      </div>

      {/* 카테고리 탭 (가로 휠 스크롤) */}
      <div
        ref={scrollRef}
        onWheel={handleWheel}
        style={{
          ['--scrollbar-thumb' as string]: '#c2c2c2',
        }}
        className="horizon-scrollbar flex cursor-ew-resize gap-2 overflow-x-auto border-b-2 border-neutral-300 pb-5"
      >
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`rounded-md px-2.5 py-1 text-[10px] font-bold whitespace-nowrap transition-colors ${
              activeCategory === category
                ? 'bg-neutral-900 text-white'
                : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800'
            }`}
          >
            {category.toUpperCase()}
          </button>
        ))}
      </div>

      {/* 아이콘 */}
      <div
        style={{
          ['--scrollbar-thumb' as string]: '#c2c2c2',
        }}
        className="chat-scrollbar grid max-h-75 grid-cols-5 gap-3 overflow-y-auto pr-1"
      >
        {filteredIcons.length > 0 ? (
          filteredIcons.map((icon: StackIconInfo) => (
            <button
              key={icon.id}
              onClick={() => handleIconClick(icon)}
              className="group flex flex-col items-center justify-center gap-1.5 rounded-lg border border-transparent p-1 transition-all hover:bg-sky-50"
              title={icon.name}
            >
              <div className="relative flex h-12 w-12 items-center justify-center rounded-lg border border-neutral-100 bg-white shadow-sm transition-shadow group-hover:shadow-md">
                <Image
                  src={icon.src}
                  alt={icon.name}
                  width={32}
                  height={32}
                  className="object-contain grayscale-[0.3] filter transition-all duration-200 group-hover:scale-110 group-hover:grayscale-0"
                  unoptimized
                />
              </div>
              <span className="w-full truncate px-0.5 text-center text-[9px] font-medium text-neutral-500 group-hover:text-sky-600">
                {icon.name}
              </span>
            </button>
          ))
        ) : (
          <div className="col-span-5 py-8 text-center text-xs text-neutral-800">
            결과 없음
          </div>
        )}
      </div>
    </div>
  );
}
