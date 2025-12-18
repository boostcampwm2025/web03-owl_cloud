'use client';

import React from 'react';
import { WorkspaceItem } from '@/types/workspace';

// 아이템 컴포넌트
// import TextItem from './TextItem';
import ImageItem from './ImageItem';
// import VideoItem from './VideoItem';

interface RenderItemProps {
  item: WorkspaceItem;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onChange: (newAttributes: Partial<WorkspaceItem>) => void;
}

export default function RenderItem({
  item,
  isSelected,
  onSelect,
  onChange,
}: RenderItemProps) {
  switch (item.type) {
    case 'text':
      //   <TextItem
      //     item={item}
      //     isSelected={isSelected}
      //     onSelect={() => onSelect(item.id)}
      //     onChange={onChange}
      //   />;
      return null;

    case 'image':
      return (
        <ImageItem
          item={item}
          isSelected={isSelected}
          onSelect={() => onSelect(item.id)}
          onChange={onChange}
        />
      );

    case 'video':
      return (
        <VideoItem
          item={item}
          isSelected={isSelected}
          onSelect={() => onSelect(item.id)}
          onChange={onChange}
        />
      );

    default:
      return null;
  }
}
