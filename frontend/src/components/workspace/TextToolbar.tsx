'use client';

import { useState, useRef, useEffect } from 'react';
import { TextItem, FontStyle } from '@/types/workspace';
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

type EditableTextKey =
  | 'fontFamily'
  | 'fontSize'
  | 'fontStyle'
  | 'textDecoration'
  | 'align'
  | 'fill';

type UpdateTextItem = <Key extends EditableTextKey>(
  attr: Key,
  value: TextItem[Key],
) => void;

type TextToolbarProps = {
  selectedText: TextItem | undefined;
  onUpdate: UpdateTextItem;
};

const FONT_OPTIONS = [
  { label: 'Arial', value: 'Arial' },
  { label: 'Verdana', value: 'Verdana' },
  { label: 'Georgia', value: 'Georgia' },
  { label: 'Courier', value: 'Courier New' },
  { label: 'Times', value: 'Times New Roman' },
];

export default function TextToolbar({
  selectedText,
  onUpdate,
}: TextToolbarProps) {
  const [isFontDropdownOpen, setIsFontDropdownOpen] = useState(false);
  const fontDropdownRef = useRef<HTMLDivElement>(null);

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

  if (!selectedText) return null;

  const isBold = selectedText.fontStyle.includes('bold');
  const isItalic = selectedText.fontStyle.includes('italic');
  const decoration = selectedText.textDecoration;

  const toggleStyle = (type: 'bold' | 'italic') => {
    let newStyle: string = selectedText.fontStyle;

    if (type === 'bold') {
      newStyle = isBold
        ? newStyle.replace('bold', '').trim()
        : `${newStyle} bold`.trim();
    } else {
      newStyle = isItalic
        ? newStyle.replace('italic', '').trim()
        : `${newStyle} italic`.trim();
    }

    if (!newStyle) newStyle = 'normal';
    onUpdate('fontStyle', newStyle as FontStyle);
  };

  return (
    <div className="flex items-center gap-2 rounded bg-neutral-800 p-2 text-neutral-50">
      {/* 폰트 종류 */}
      <div className="relative h-8 w-40" ref={fontDropdownRef} title="글꼴">
        <button
          onClick={() => setIsFontDropdownOpen(!isFontDropdownOpen)}
          className="flex h-full w-full items-center justify-between rounded bg-neutral-700 px-2 text-sm focus:outline-none"
        >
          <span
            className="truncate"
            style={{ fontFamily: selectedText.fontFamily }}
          >
            {FONT_OPTIONS.find((f) => f.value === selectedText.fontFamily)
              ?.label || selectedText.fontFamily}
          </span>
          <ArrowDownIcon className="h-4 w-4 text-neutral-300" />
        </button>

        {isFontDropdownOpen && (
          <ul className="absolute top-full left-0 z-50 mt-1 w-full overflow-hidden rounded bg-neutral-800 py-1 shadow-lg ring-1 ring-white/10">
            {FONT_OPTIONS.map((option) => (
              <li
                key={option.value}
                onClick={() => {
                  onUpdate(
                    'fontFamily',
                    option.value as TextItem['fontFamily'],
                  );
                  setIsFontDropdownOpen(false);
                }}
                className={`cursor-pointer px-3 py-1.5 text-sm transition-colors hover:bg-neutral-600 ${
                  selectedText.fontFamily === option.value
                    ? 'bg-neutral-600 text-white'
                    : 'text-neutral-300'
                } `}
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
          onClick={() =>
            onUpdate('fontSize', Math.max(1, selectedText.fontSize - 1))
          }
        />
        <input
          type="number"
          value={selectedText.fontSize}
          min={1}
          max={100}
          onChange={(e) => {
            const value = Number(e.target.value);
            if (Number.isNaN(value)) return;
            onUpdate('fontSize', Math.min(100, Math.max(1, value)));
          }}
          className="h-8 w-8 appearance-none bg-transparent text-center text-sm outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <NavButton
          icon={PlusIcon}
          label="글꼴 크기 늘리기"
          bgColor="bg-neutral-700"
          onClick={() =>
            onUpdate('fontSize', Math.min(100, selectedText.fontSize + 1))
          }
        />
      </div>

      {/* 색상 */}
      <div className="h-8 w-px bg-neutral-200" />
      <NavButton icon={TextColorIcon} label="TextColor" />
      <NavButton icon={BgColorIcon} label="BgColor" />

      {/* 정렬 */}
      <div className="h-8 w-px bg-neutral-200" />
      <NavButton
        icon={AlignLeftIcon}
        label="AlignLeft"
        isActive={selectedText.align === 'left'}
        onClick={() => onUpdate('align', 'left')}
      />
      <NavButton
        icon={AlignCenterIcon}
        label="AlignCenter"
        isActive={selectedText.align === 'center'}
        onClick={() => onUpdate('align', 'center')}
      />
      <NavButton
        icon={AlignRightIcon}
        label="AlignRight"
        isActive={selectedText.align === 'right'}
        onClick={() => onUpdate('align', 'right')}
      />

      {/* 스타일 */}
      <div className="h-8 w-px bg-neutral-200" />
      <NavButton
        icon={BoldIcon}
        label="Bold"
        isActive={isBold}
        onClick={() => toggleStyle('bold')}
      />
      <NavButton
        icon={ItalicIcon}
        label="Italic"
        isActive={isItalic}
        onClick={() => toggleStyle('italic')}
      />
      <NavButton icon={LinkIcon} label="Link" />
      <NavButton
        icon={UnderlineIcon}
        label="Underline"
        isActive={decoration === 'underline'}
        onClick={() =>
          onUpdate(
            'textDecoration',
            decoration === 'underline' ? '' : 'underline',
          )
        }
      />
      <NavButton
        icon={StrikeThroughIcon}
        label="StrikeThrough"
        isActive={decoration === 'line-through'}
        onClick={() =>
          onUpdate(
            'textDecoration',
            decoration === 'line-through' ? '' : 'line-through',
          )
        }
      />

      <div className="h-8 w-px bg-neutral-200" />
      <NavButton icon={UnorderListIcon} label="UnorderList" />
      <NavButton icon={OrderedListIcon} label="OrderedList" />
    </div>
  );
}
