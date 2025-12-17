'use client';

import { TextItem, FontStyle } from '@/types/workspace';
import IconButton from './IconButton';

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

const ALIGN_ORDER: TextItem['align'][] = ['left', 'center', 'right'];

const ALIGN_ICON: Record<TextItem['align'], string> = {
  left: '/icons/toolbar/align-left.svg',
  center: '/icons/toolbar/align-center.svg',
  right: '/icons/toolbar/align-right.svg',
};

export default function TextToolbar({
  selectedText,
  onUpdate,
}: TextToolbarProps) {
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

  const getNextAlign = (current: TextItem['align']): TextItem['align'] => {
    const index = ALIGN_ORDER.indexOf(current);
    return ALIGN_ORDER[(index + 1) % ALIGN_ORDER.length];
  };

  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-white px-3 py-2 shadow-md">
      {/* 폰트 종류 */}
      <div className="hover:bg-gray-50">
        <select
          value={selectedText.fontFamily}
          title="글꼴"
          onChange={(e) =>
            onUpdate('fontFamily', e.target.value as TextItem['fontFamily'])
          }
          className="hover: h-8 rounded border border-gray-300 px-2 text-sm text-slate-700 focus:outline-none"
        >
          <option value="Arial">Arial</option>
          <option value="Verdana">Verdana</option>
          <option value="Georgia">Georgia</option>
          <option value="Courier New">Courier</option>
          <option value="Times New Roman">Times</option>
        </select>
      </div>

      {/* 폰트 크기 */}
      <div className="flex items-center overflow-hidden rounded border border-gray-300">
        <IconButton
          icon="/icons/toolbar/minus.svg"
          title="글꼴 크기 줄이기"
          variant="ghost"
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
          className="h-8 w-10 appearance-none text-center text-sm text-slate-700 outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />

        <IconButton
          icon="/icons/toolbar/plus.svg"
          title="글꼴 크기 늘리기"
          variant="ghost"
          onClick={() =>
            onUpdate('fontSize', Math.min(100, selectedText.fontSize + 1))
          }
        />
      </div>

      {/* 스타일 */}
      <IconButton
        icon="/icons/toolbar/text-bold.svg"
        active={isBold}
        color="lime"
        title="굵게"
        onClick={() => toggleStyle('bold')}
      />

      <IconButton
        icon="/icons/toolbar/underline.svg"
        active={decoration === 'underline'}
        title="밑줄"
        onClick={() =>
          onUpdate(
            'textDecoration',
            decoration === 'underline' ? '' : 'underline',
          )
        }
      />

      <IconButton
        icon="/icons/toolbar/editor-strike.svg"
        active={decoration === 'line-through'}
        title="취소선"
        onClick={() =>
          onUpdate(
            'textDecoration',
            decoration === 'line-through' ? '' : 'line-through',
          )
        }
      />

      {/* 정렬 */}
      <IconButton
        icon={ALIGN_ICON[selectedText.align]}
        title={'정렬'}
        onClick={() => onUpdate('align', getNextAlign(selectedText.align))}
      />

      {/* 색상 */}
      <div className="relative h-8 w-8 overflow-hidden rounded-md border border-gray-300">
        <input
          type="color"
          title="텍스트 색상"
          value={selectedText.fill}
          onChange={(e) => onUpdate('fill', e.target.value)}
          className="absolute -top-2 -left-2 h-12 w-12 cursor-pointer border-0 p-0"
        />
      </div>
    </div>
  );
}
