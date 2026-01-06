import Portal from '@/components/common/Portal';

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
  return (
    <Portal>
      <div
        className="flex-center fixed top-0 left-0 z-50 h-screen w-screen bg-neutral-900/30"
        onClick={onCancel}
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
            className={`flex-1 ${isLightMode ? styles.section.light : styles.section.dark}`}
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
