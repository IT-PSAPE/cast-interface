import type { ReactNode } from 'react';

interface SelectableRowProps {
  selected: boolean;
  leading?: ReactNode;
  title: string;
  onClick: () => void;
  trailing?: ReactNode;
}

export function SelectableRow({ selected, leading, title, onClick, trailing }: SelectableRowProps) {
  const rowClasses = selected
    ? 'bg-brand-400/25 text-text-primary'
    : 'text-text-secondary hover:bg-background-tertiary/55';

  return (
    <button onClick={onClick} className={`flex h-7 w-full items-center gap-2 rounded px-1.5 text-left transition-colors ${rowClasses}`}>
      {leading}
      <span className="min-w-0 flex-1 truncate text-[12px] font-medium">{title}</span>
      {trailing}
    </button>
  );
}
