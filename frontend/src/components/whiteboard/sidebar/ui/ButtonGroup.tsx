'use client';

import { ComponentType, SVGProps } from 'react';

interface ButtonGroupOption<T> {
  value: T;
  label: string;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
}

interface ButtonGroupProps<T> {
  label: string;
  options: ButtonGroupOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export default function ButtonGroup<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: ButtonGroupProps<T>) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-neutral-700">{label}</span>
      <div className="flex gap-1 text-neutral-700">
        {options.map((option) => {
          const Icon = option.icon;
          return (
            <button
              key={option.value}
              onClick={() => onChange(option.value)}
              className={`flex flex-1 items-center justify-center gap-1 rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                value === option.value
                  ? 'bg-sky-200'
                  : 'bg-neutral-100 hover:bg-neutral-200'
              }`}
            >
              {Icon && <Icon className="h-4 w-4" />}
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
