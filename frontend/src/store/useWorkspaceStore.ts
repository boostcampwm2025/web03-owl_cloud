import { create } from 'zustand';
import { CardData, WorkspaceItem } from '@/types/WorkSpace';

// State 타입 정의
interface WorkspaceState {
  // 캔버스 전체 데이터
  cardData: CardData;

  // 선택된 아이템 ID
  selectedId: string | null;

  // 화면 줌 레벨 (1 = 100%)
  zoom: number;
}

// Action 타입 정의
interface WorkspaceActions {
  // 전체 데이터 설정 (초기화 또는 불러오기)
  setCardData: (data: CardData) => void;

  // 아이템 조작
  addItem: (item: WorkspaceItem) => void;
  updateItem: (id: string, newAttributions: Partial<WorkspaceItem>) => void;
  removeItem: (id: string) => void;

  // 선택 및 뷰 조작
  selectItem: (id: string | null) => void;
  setZoom: (zoom: number) => void;

  // 워크스페이스 크기 및 배경 설정
  resizeWorkspace: (width: number, height: number) => void;
  setBackground: (color: string) => void;
}

// 초기 카드 데이터
const initialCardData: CardData = {
  id: 'card-id',
  title: 'card-title',
  userId: 'user-id',
  workspaceWidth: 1200,
  workspaceHeight: 700,
  backgroundColor: '#ffffff',
  items: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Store 생성
export const useWorkspaceStore = create<WorkspaceState & WorkspaceActions>(
  (set) => ({
    cardData: initialCardData,
    selectedId: null,
    zoom: 1,

    setCardData: (data) => set({ cardData: data }),

    addItem: (item) =>
      set((state) => ({
        cardData: {
          ...state.cardData,
          items: [...state.cardData.items, item],
        },
        selectedId: item.id,
      })),

    updateItem: (id, newAttributions) =>
      set((state) => ({
        cardData: {
          ...state.cardData,
          items: state.cardData.items.map((item) =>
            item.id === id
              ? ({ ...item, ...newAttributions } as WorkspaceItem)
              : item,
          ),
        },
      })),

    removeItem: (id) =>
      set((state) => ({
        cardData: {
          ...state.cardData,
          items: state.cardData.items.filter((item) => item.id !== id),
        },
        selectedId: state.selectedId === id ? null : state.selectedId,
      })),

    selectItem: (id) => set({ selectedId: id }),

    setZoom: (zoom) => set({ zoom }),

    resizeWorkspace: (width, height) =>
      set((state) => ({
        cardData: {
          ...state.cardData,
          workspaceWidth: width,
          workspaceHeight: height,
        },
      })),

    setBackground: (color) =>
      set((state) => ({
        cardData: { ...state.cardData, backgroundColor: color },
      })),
  }),
);
