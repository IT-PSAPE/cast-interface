import type { ReactNode } from 'react';

interface TabBarProps {
  label: string;
  children: ReactNode;
  className?: string;
  bordered?: boolean;
}

export function TabBar({ label, children, className = '', bordered = true }: TabBarProps) {
  return (
    <nav className={`flex items-center gap-0.5 ${className}`.trim()} role="tablist" aria-label={label}>
      {children}
    </nav>
  );
}

interface TabProps {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}

export function Tab({ active, onClick, children }: TabProps) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`-mb-px border-0 border-b-2 px-2 py-1.5 text-[12px] leading-tight cursor-pointer transition-colors ${
        active
          ? 'border-b-selected text-text-primary font-medium'
          : 'border-b-transparent text-text-muted hover:text-text-secondary'
      }`}
    >
      {children}
    </button>
  );
}
