'use client';

// 섹션 컴포넌트
// title : 섹션 제목
// children : 섹션 내용
interface SectionProps {
  title?: string;
  children: React.ReactNode;
}

export default function Section({ title, children }: SectionProps) {
  return (
    <div className="flex flex-col gap-2 px-1 py-2">
      {title && (
        <h3 className="text-xs font-bold tracking-wide text-black uppercase select-none">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}
