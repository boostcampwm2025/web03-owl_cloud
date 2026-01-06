import type { Ref } from 'react';

export type ButtonSize = 'sm' | 'lg';
export type ButtonShape = 'square' | 'rounded';
export type ButtonColor =
  | 'active'
  | 'primary'
  | 'outlinePrimary'
  | 'secondary'
  | 'disabled';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: ButtonSize;
  shape?: ButtonShape;
  color?: ButtonColor;
  ref?: Ref<HTMLButtonElement>;
}
