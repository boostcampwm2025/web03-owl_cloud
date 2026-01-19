export interface ToggleProps {
  checked?: boolean; // controlled
  defaultChecked?: boolean; // uncontrolled
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}
