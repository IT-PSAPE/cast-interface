import type { ReactNode } from 'react';

interface SegmentedControlProps {
  label: string;
  children: ReactNode;
  className?: string;
}

interface SegmentedControlItemProps {
  active: boolean;
  onClick: () => void;
  title: string;
  children: ReactNode;
}

export function SegmentedControl({ label, children, className = '' }: SegmentedControlProps) {
  return (
    <div role="group" aria-label={label} className={`inline-flex items-center rounded border border-stroke bg-surface-2/40 p-0.5 ${className}`}>
      {children}
    </div>
  );
}

export function SegmentedControlItem({ active, onClick, title, children }: SegmentedControlItemProps) {
  const classes = active
    ? 'bg-accent text-text-primary'
    : 'bg-transparent text-text-muted hover:text-text-secondary';
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={active}
      className={`grid h-6 min-w-6 place-items-center rounded px-2 text-[12px] transition-colors ${classes}`}
    >
      {children}
    </button>
  );
}
