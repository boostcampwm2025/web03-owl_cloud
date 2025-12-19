import { create } from 'zustand';
import { CardData } from '@/types/workspace';

// State 타입 정의
interface CardDetailStore {
  // 카드 전체 데이터
  cardData: CardData;

  // 반응 추가 활성화 여부
  addingReaction: boolean;

  // 반응 표시 활성화 여부
  showingReaction: boolean;

  // 카드 로딩 여부
  isLoading: boolean;
}

// Action 타입 정의
interface CardDetailActions {
  // 카드 전체 데이터 설정
  setCardData: (data: CardData) => void;

  // 반응 추가 상태 조작
  setAddingReaction: (newState: boolean) => void;

  // 반응 표시 상태 조작
  setShowingReaction: (newState: boolean) => void;
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
export const useCardDetailStore = create<CardDetailStore & CardDetailActions>(
  (set) => ({
    cardData: initialCardData,
    addingReaction: false,
    showingReaction: true,
    isLoading: true,

    setCardData: (data) => {
      set({ cardData: data, isLoading: false });
    },

    setAddingReaction: (newState) => set({ addingReaction: newState }),

    setShowingReaction: (newState) => set({ showingReaction: newState }),
  }),
);
