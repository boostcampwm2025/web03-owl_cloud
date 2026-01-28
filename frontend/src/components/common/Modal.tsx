import Portal from '@/components/common/Portal';
import { useRef } from 'react';

interface ModalProps {
  title: string;
  cancelText: string;
  onCancel: () => void;
  confirmText?: string;
  onConfirm?: () => void;
  isLightMode?: boolean;
  children?: React.ReactNode;

  // Confirm 버튼을 빨간색으로 변경
  isWarning?: boolean;
}

export default function Modal({
  title,
  cancelText,
  onCancel,
  confirmText,
  onConfirm,
  isLightMode,
  children,
  isWarning,
}: ModalProps) {
  // 마우스 클릭 시작 지점과 종료 시점이 둘 다 배경인지 확인
  // 모달 안에서 드래그 후 밖으로 나갈 시 모달이 닫히는 현상 방지
  const onOverlayClick = useRef(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    // 클릭된 영역이 배경인지 확인
    if (e.target === e.currentTarget) {
      onOverlayClick.current = true;
    } else {
      onOverlayClick.current = false;
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    // 배경을 클릭하며 시작 && 마우스가 떨어진 시점의 영역이 배경인지 확인
    if (onOverlayClick.current && e.target === e.currentTarget) {
      onCancel();
    }
    onOverlayClick.current = false;
  };

  return (
    <Portal>
      <div
        className="flex-center fixed top-0 left-0 z-50 h-screen w-screen bg-neutral-900/30"
        onMouseDown={handleMouseDown} // onClick 대신 MouseDown/Up 사용
        onMouseUp={handleMouseUp}
      >
        <dialog
          className={`relative flex min-h-40 min-w-80 flex-col gap-4 rounded-lg border p-6 ${isLightMode ? styles.dialog.light : styles.dialog.dark}`}
          onClick={(e) => e.stopPropagation()}
        >
          <h2
            className={`font-bold ${isLightMode ? styles.h2.light : styles.h2.dark}`}
          >
            {title}
          </h2>
          <section
            className={`flex-1 whitespace-pre-wrap ${isLightMode ? styles.section.light : styles.section.dark}`}
          >
            {children}
          </section>
          <div className="flex w-full justify-end gap-3">
            <button
              onClick={onCancel}
              className={`rounded-sm px-3 py-1.5 text-sm font-bold ${isLightMode ? styles.cancelBtn.light : styles.cancelBtn.dark}`}
            >
              {cancelText}
            </button>
            {confirmText && onConfirm && (
              <button
                onClick={onConfirm}
                className={`rounded-sm px-3 py-1.5 text-sm font-bold ${isLightMode ? styles.confirmBtn.light : styles.confirmBtn.dark} ${isWarning ? (isLightMode ? 'bg-red-600!' : 'bg-red-700!') : ''}`}
              >
                {confirmText}
              </button>
            )}
          </div>
        </dialog>
      </div>
    </Portal>
  );
}

const styles = {
  dialog: {
    light: 'bg-white border-neutral-200',
    dark: 'bg-neutral-600 border-neutral-500',
  },
  h2: { light: 'text-neutral-900', dark: 'text-neutral-50' },
  section: { light: 'text-neutral-600', dark: 'text-neutral-200' },
  cancelBtn: {
    light: 'bg-neutral-200 text-neutral-900',
    dark: 'bg-neutral-500 text-neutral-50',
  },
  confirmBtn: {
    light: 'bg-sky-600 text-neutral-50',
    dark: 'bg-sky-700 text-neutral-50',
  },
};
