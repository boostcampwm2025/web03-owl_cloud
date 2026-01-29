import { ButtonHTMLAttributes, ReactNode } from 'react';

interface MeetingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  text: string;
  isActive?: boolean;
}

export default function MeetingButton({
  icon,
  text,
  isActive,
  ...props
}: MeetingButtonProps) {
  return (
    <button
      {...props}
      className={`flex-center h-16 w-full max-w-22 flex-col gap-0.5 rounded-lg text-neutral-200 ${isActive ? 'bg-sky-700' : 'hover:bg-neutral-700'}`}
    >
      {icon}
      <span className="text-xs font-bold">{text}</span>
    </button>
  );
}
