'use client';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}

export default function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: SliderProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-neutral-700">{label}</span>
        <span className="text-xs font-medium text-neutral-700">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-neutral-200 accent-sky-700"
      />
    </div>
  );
}
