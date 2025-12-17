'use client';

import { TextItem, FontStyle } from '@/types/workspace';

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

  const btnClass = (isActive: boolean) =>
    `w-8 h-8 flex items-center justify-center rounded border transition-colors ${
      isActive
        ? 'bg-lime-300 text-white border-lime-400'
        : 'bg-white text-slate-700 border-gray-300 hover:bg-gray-50'
    }`;

  const inputClass =
    'h-8 border border-gray-300 rounded px-2 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-lime-400';

  return (
    <div className="flex items-center gap-2 rounded-xl border border-gray-100 bg-white p-2 duration-200">
      {/* 1. 폰트 종류 */}
      <select
        value={selectedText.fontFamily}
        onChange={(e) =>
          onUpdate('fontFamily', e.target.value as TextItem['fontFamily'])
        }
        className={inputClass}
      >
        <option value="Arial">Arial</option>
        <option value="Verdana">Verdana</option>
        <option value="Georgia">Georgia</option>
        <option value="Courier New">Courier</option>
        <option value="Times New Roman">Times</option>
      </select>

      {/* 2. 폰트 크기 */}
      <input
        type="number"
        value={selectedText.fontSize}
        onChange={(e) => {
          onUpdate('fontSize', Number(e.target.value));
        }}
        className={`${inputClass} w-16`}
        min={1}
        max={100}
      />

      {/* Divider */}
      <div className="mx-1 h-5 w-px bg-gray-300" />

      {/* 3. 스타일 */}
      <div className="flex gap-1">
        <button
          onClick={() => toggleStyle('bold')}
          className={`${btnClass(isBold)} font-bold`}
          title="Bold"
        >
          B
        </button>
        <button
          onClick={() => toggleStyle('italic')}
          className={`${btnClass(isItalic)} italic`}
          title="Italic"
        >
          I
        </button>
        <button
          onClick={() =>
            onUpdate(
              'textDecoration',
              decoration === 'underline' ? '' : 'underline',
            )
          }
          className={`${btnClass(
            decoration === 'underline',
          )} underline underline-offset-2`}
          title="Underline"
        >
          U
        </button>
        <button
          onClick={() =>
            onUpdate(
              'textDecoration',
              decoration === 'line-through' ? '' : 'line-through',
            )
          }
          className={`${btnClass(decoration === 'line-through')} line-through`}
          title="Strikethrough"
        >
          S
        </button>
      </div>

      <div className="mx-1 h-5 w-px bg-gray-300" />

      {/* 4. 정렬 */}
      <select
        value={selectedText.align}
        onChange={(e) => onUpdate('align', e.target.value as TextItem['align'])}
        className={inputClass}
      >
        <option value="left">Left</option>
        <option value="center">Center</option>
        <option value="right">Right</option>
      </select>

      {/* 5. 색상 */}
      <div className="relative h-8 w-8 cursor-pointer overflow-hidden rounded border border-gray-300 transition-all hover:ring-2 hover:ring-blue-200">
        <input
          type="color"
          value={selectedText.fill}
          onChange={(e) => onUpdate('fill', e.target.value)}
          className="absolute -top-2 -left-2 h-12 w-12 cursor-pointer border-0 p-0"
        />
      </div>
    </div>
  );
}
