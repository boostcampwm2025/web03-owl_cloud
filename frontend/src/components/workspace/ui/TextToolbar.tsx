'use client';

import { useState, useRef, useEffect } from 'react';
import NavButton from './NavButton';

import { ArrowDownIcon, MinusIcon, PlusIcon } from '@/assets/icons/common';
import {
  TextColorIcon,
  BgColorIcon,
  AlignLeftIcon,
  AlignCenterIcon,
  AlignRightIcon,
  BoldIcon,
  ItalicIcon,
  LinkIcon,
  UnderlineIcon,
  StrikeThroughIcon,
  UnorderListIcon,
  OrderedListIcon,
} from '@/assets/icons/editor';

const FONT_OPTIONS = [
  { label: 'Arial', value: 'Arial' },
  { label: 'Verdana', value: 'Verdana' },
  { label: 'Georgia', value: 'Georgia' },
  { label: 'Courier', value: 'Courier New' },
  { label: 'Times', value: 'Times New Roman' },
];

export default function TextToolbar() {
  const [isFontDropdownOpen, setIsFontDropdownOpen] = useState(false);
  const fontDropdownRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        fontDropdownRef.current &&
        !fontDropdownRef.current.contains(event.target as Node)
      ) {
        setIsFontDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex items-center gap-2 rounded bg-neutral-800 p-2 text-neutral-50">
      {/* 폰트 종류 */}
      <div className="relative h-8 w-40" ref={fontDropdownRef} title="글꼴">
        <button
          onClick={() => setIsFontDropdownOpen(!isFontDropdownOpen)}
          className="flex h-full w-full items-center justify-between rounded bg-neutral-700 px-2 text-sm focus:outline-none"
        >
          <span className="truncate"></span>
          <ArrowDownIcon className="h-4 w-4 text-neutral-300" />
        </button>

        {/* 폰트 선택 드롭다운 */}
        {isFontDropdownOpen && (
          <ul className="absolute top-full left-0 z-50 mt-1 w-full overflow-hidden rounded bg-neutral-800 py-1 shadow-lg ring-1 ring-white/10">
            {FONT_OPTIONS.map((option) => (
              <li
                key={option.value}
                onClick={() => {
                  setIsFontDropdownOpen(false);
                }}
                className="cursor-pointer px-3 py-1.5 text-sm transition-colors hover:bg-neutral-600"
                style={{ fontFamily: option.value }}
              >
                {option.label}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 폰트 크기 */}
      <div className="flex items-center rounded bg-neutral-700">
        <NavButton
          icon={MinusIcon}
          label="글꼴 크기 줄이기"
          bgColor="bg-neutral-700"
        />
        <input
          type="number"
          value={16}
          className="h-8 w-8 appearance-none bg-transparent text-center text-sm outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <NavButton
          icon={PlusIcon}
          label="글꼴 크기 늘리기"
          bgColor="bg-neutral-700"
        />
      </div>

      {/* 색상 */}
      <div className="h-8 w-px bg-neutral-200" />
      <NavButton icon={TextColorIcon} label="글자 색상" />
      <NavButton icon={BgColorIcon} label="배경 색상" />

      {/* 정렬 */}
      <div className="h-8 w-px bg-neutral-200" />
      <NavButton icon={AlignLeftIcon} label="좌측 정렬" />
      <NavButton icon={AlignCenterIcon} label="중앙 정렬" />
      <NavButton icon={AlignRightIcon} label="우측 정렬" />

      {/* 스타일 */}
      <div className="h-8 w-px bg-neutral-200" />
      <NavButton icon={BoldIcon} label="굵게" />
      <NavButton icon={ItalicIcon} label="기울임" />
      <NavButton icon={UnderlineIcon} label="밑줄" />
      <NavButton icon={StrikeThroughIcon} label="취소선" />
      <NavButton icon={LinkIcon} label="링크" />

      {/* 목록 */}
      <div className="h-8 w-px bg-neutral-200" />
      <NavButton icon={UnorderListIcon} label="순서 없는 목록" />
      <NavButton icon={OrderedListIcon} label="순서 있는 목록" />
    </div>
  );
}
