'use client';

import { ComponentType, SVGProps } from 'react';

interface MultipleButtonGroupOption<T> {
  value: T;
  label?: string;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
}

interface MultipleButtonGroupProps<T> {
  label: string;
  options: MultipleButtonGroupOption<T>[];
  value: T[];
  onChange: (value: T[]) => void;
}

export default function MultipleButtonGroup<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: MultipleButtonGroupProps<T>) {
  const handleClick = (optionValue: T) => {
    const newValues = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue];
    onChange(newValues);
  };

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-neutral-700">{label}</span>
      <div className="flex gap-1 text-neutral-700">
        {options.map((option) => {
          const Icon = option.icon;
          const selected = value.includes(option.value);
          return (
            <button
              key={option.value}
              onClick={() => handleClick(option.value)}
              className={`flex h-7 flex-1 items-center justify-center gap-1 rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                selected ? 'bg-sky-200' : 'bg-neutral-100 hover:bg-neutral-200'
              }`}
            >
              {Icon ? <Icon className="h-5 w-5" /> : option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
