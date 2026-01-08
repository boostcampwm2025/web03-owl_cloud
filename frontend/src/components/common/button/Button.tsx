import { type PropsWithChildren } from 'react';
import type { ButtonColor, ButtonProps } from './Button.types';
import { ButtonShape, ButtonSize } from './Button.types';
import { cn } from '@/utils/cn';

const style: {
  base: string;
  size: Record<ButtonSize, string>;
  shape: Record<ButtonShape, string>;
  color: Record<ButtonColor, string>;
} = {
  base: 'inline-flex items-center justify-center box-border select-none m-0 p-0 w-fit h-fit cursor-pointer disabled:cursor-default',
  size: {
    sm: 'h-full h-auto px-3 px-1.5 text-sm font-bold',
    lg: 'w-full h-full max-h-[52px] py-4 px-2 text-base font-bold',
  },
  shape: {
    square: 'rounded-lg',
    rounded: 'rounded-full',
  },
  color: {
    active: 'text-white', // TODO: 버튼 호버 시 활성화되는 스타일
    primary: 'bg-sky-600 text-white hover:bg-sky-700', // sky
    secondary: 'bg-sky-700 text-white', // dark-sky
    outlinePrimary: 'bg-white border border-sky-600 text-sky-600',
    disabled: 'bg-neutral-500 text-white', // ex. 취소 버튼
  },
};

const Button = ({
  size = 'lg',
  shape = 'rounded',
  color = 'primary',
  className,
  children,
  ref,
  ...rest
}: PropsWithChildren<ButtonProps>) => {
  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        style.base,
        style.shape[shape],
        style.size[size],
        style.color[color],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
};

Button.displayName = 'Button';

export default Button;
