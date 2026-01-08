import { ArrowDownIcon } from '@/assets/icons/common';
import { useState } from 'react';

interface Props {
  label: string;
  devices: MediaDeviceInfo[];
  icon: React.ComponentType<{ className?: string }>;
  selectedId: string;
  onSelect: (id: string) => void;
  className?: string;
}

export function DeviceDropdown({
  label,
  devices,
  icon: Icon,
  selectedId,
  onSelect,
  className,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const selected = devices.find((d) => d.deviceId === selectedId);
  const isDisabled = devices.length === 0;

  return (
    <div className={`relative min-w-0 ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isDisabled}
        className={`flex w-full items-center justify-between gap-2 rounded-sm border border-neutral-300 px-3 py-2 text-sm transition-colors ${
          isDisabled
            ? 'cursor-not-allowed bg-neutral-100 text-neutral-400' // 비활성화 스타일
            : 'border-neutral-300 bg-white text-neutral-700 hover:border-neutral-400'
        }`}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="truncate">{selected?.label || `접근 권한 필요`}</span>

        <ArrowDownIcon className="h-4 w-4 shrink-0" />
      </button>

      {!isDisabled && isOpen && (
        <ul className="absolute z-10 mt-1 max-h-30 w-full overflow-y-auto rounded-sm border border-neutral-200 bg-white shadow">
          {devices.map((device) => (
            <li
              key={device.deviceId}
              onClick={() => {
                onSelect(device.deviceId);
                setIsOpen(false);
              }}
              className="cursor-pointer px-3 py-2 text-sm first:rounded-t-sm last:rounded-b-sm hover:bg-neutral-100"
            >
              {device.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
