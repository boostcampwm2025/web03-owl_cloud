'use client';

import MultipleButtonGroup from '@/components/whiteboard/sidebar/ui/MultipleButtonGroup';
import {
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  StrikeThroughIcon,
} from '@/assets/icons/whiteboard/text';

// Text 스타일 설정 section
interface TextStyleSectionProps {
  fontStyle: string;
  textDecoration: string;
  onChangeFontStyle: (fontStyle: string) => void;
  onChangeTextDecoration: (textDecoration: string) => void;
}

type StyleValue = 'bold' | 'italic' | 'underline' | 'line-through';

export default function TextFormatSection({
  fontStyle,
  textDecoration,
  onChangeFontStyle,
  onChangeTextDecoration,
}: TextStyleSectionProps) {
  // 현재 선택된 스타일들을 배열로 변환
  const selectedStyles: StyleValue[] = [];
  if (fontStyle.includes('bold')) selectedStyles.push('bold');
  if (fontStyle.includes('italic')) selectedStyles.push('italic');
  if (textDecoration.includes('underline')) selectedStyles.push('underline');
  if (textDecoration.includes('line-through'))
    selectedStyles.push('line-through');

  // 배열을 fontStyle과 textDecoration으로 분리
  const handleChange = (styles: StyleValue[]) => {
    // fontStyle 처리
    const hasBold = styles.includes('bold');
    const hasItalic = styles.includes('italic');
    if (!hasBold && !hasItalic) {
      onChangeFontStyle('normal');
    } else if (hasBold && hasItalic) {
      onChangeFontStyle('bold italic');
    } else if (hasBold) {
      onChangeFontStyle('bold');
    } else {
      onChangeFontStyle('italic');
    }

    // textDecoration 처리
    const hasUnderline = styles.includes('underline');
    const hasStrikeThrough = styles.includes('line-through');
    if (!hasUnderline && !hasStrikeThrough) {
      onChangeTextDecoration('none');
    } else if (hasUnderline && hasStrikeThrough) {
      onChangeTextDecoration('underline line-through');
    } else if (hasUnderline) {
      onChangeTextDecoration('underline');
    } else {
      onChangeTextDecoration('line-through');
    }
  };

  return (
    <MultipleButtonGroup
      label="Format"
      options={[
        { value: 'bold' as const, icon: BoldIcon },
        { value: 'italic' as const, icon: ItalicIcon },
        { value: 'underline' as const, icon: UnderlineIcon },
        { value: 'line-through' as const, icon: StrikeThroughIcon },
      ]}
      value={selectedStyles}
      onChange={handleChange}
    />
  );
}
