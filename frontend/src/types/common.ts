export interface ModalProps {
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
