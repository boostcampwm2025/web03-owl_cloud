import { cn } from '@/utils/cn';
import { ToggleProps } from './Toggle.types';
import { useCallback, useState } from 'react';

const sizeMap = {
  sm: 'w-8 h-4',
  md: 'w-10 h-5',
  lg: 'w-12 h-6',
};

const thumbSizeMap = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

const translateMap = {
  sm: 'translate-x-4',
  md: 'translate-x-5',
  lg: 'translate-x-6',
};

export default function Toggle({
  checked,
  defaultChecked = false,
  onChange,
  disabled = false,
  size = 'md',
  className,
}: ToggleProps) {
  const isControlled = checked !== undefined;

  const [internalChecked, setInternalChecked] =
    useState<boolean>(defaultChecked);

  const currentChecked = isControlled ? checked : internalChecked;

  const toggle = useCallback(() => {
    if (disabled) return;

    const next = !currentChecked;

    if (!isControlled) {
      setInternalChecked(next);
    }

    onChange?.(next);
  }, [currentChecked, disabled, isControlled, onChange]);

  return (
    <button
      role="switch"
      aria-checked={currentChecked}
      aria-disabled={disabled}
      disabled={disabled}
      onClick={toggle}
      className={cn(
        'relative inline-flex rounded-full transition-colors',
        sizeMap[size],
        currentChecked ? 'bg-blue-500' : 'bg-gray-200',
        disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
    >
      <span
        className={cn(
          thumbSizeMap[size],
          'absolute top-0.5 left-0.5 rounded-full bg-white shadow transition-transform',
          currentChecked && translateMap[size],
        )}
      />
    </button>
  );
}
