import { type PropsWithChildren } from 'react';
import type { ButtonColor, ButtonProps } from './Button.types';
import clsx from 'clsx';
import { ButtonShape, ButtonSize } from './Button.types';

const style: {
  base: string;
  size: Record<ButtonSize, string>;
  shape: Record<ButtonShape, string>;
  color: Record<ButtonColor, string>;
} = {
  base: 'inline-flex items-center justify-center box-border select-none m-0 p-0 w-fit h-fit cursor-pointer disabled:cursor-default',
  size: {
    sm: 'w-full max-w-[50px] h-full max-h-[50px] px-3 py-[6px] text-[14px] font-bold',
    md: '', // TODO
    lg: 'w-full max-w-[312px] h-full max-h-[52px] py-4 px-2 text-[16px] font-bold',
  },
  shape: {
    square: 'rounded-lg',
    sm: 'rounded-sm',
    rounded: 'rounded-full',
  },
  color: {
    active: 'text-white', // TODO: 버튼 호버 시 활성화되는 스타일
    primary: 'bg-sky-600 text-white', // sky
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
      className={clsx(
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
