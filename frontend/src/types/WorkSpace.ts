// 기본 타입 정의 (Enums & Types)
export type ItemType = 'text' | 'image' | 'video';

// 텍스트 정렬 및 스타일 옵션
export type TextAlign = 'left' | 'center' | 'right' | 'justify';

// 폰트 스타일 옵션
export type FontStyle = 'normal' | 'italic' | 'bold' | 'bold italic';

// 공통 속성
export interface BaseItem {
  id: string;
  type: ItemType;
  x: number;
  y: number;
  width: number;
  height?: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  opacity?: number;
  zIndex?: number;
  isLocked?: boolean;
  isVisible?: boolean;
  name?: string;
}

// 개별 아이템 정의
// 텍스트
export interface TextItem extends BaseItem {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: string;
  fill: string;
  fontStyle: FontStyle;
  textDecoration: string;
  align: TextAlign;
  lineHeight?: number;
  letterSpacing?: number;
  stroke?: string;
  strokeWidth?: number;
}

// 이미지
export interface ImageItem extends BaseItem {
  type: 'image';
  src: string;
  naturalWidth: number;
  naturalHeight: number;
  cornerRadius?: number;
  stroke?: string;
  strokeWidth?: number;
  filter?: string;
}

// 비디오
export interface VideoItem extends BaseItem {
  type: 'video';
  src: string;
  poster?: string;
  naturalWidth: number;
  naturalHeight: number;
  duration?: number;
  isAutoPlay: boolean;
  isLoop: boolean;
  isMuted: boolean;
  volume: number;
  cornerRadius?: number;
  stroke?: string;
  strokeWidth?: number;
}

// 통합 타입 (Union Type) - 워크스페이스에 배치될 아이템들
export type WorkspaceItem = TextItem | ImageItem | VideoItem;

// 워크스페이스(카드) 데이터 구조
export interface CardData {
  id: string;
  title: string;
  userId: string;

  workspaceWidth: number;
  workspaceHeight: number;
  backgroundColor: string;

  items: WorkspaceItem[];

  createdAt: string;
  updatedAt: string;
}
