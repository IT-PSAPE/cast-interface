import type { ReactNode } from 'react';

interface TabBarProps {
  label: string;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
  actionsClassName?: string;
  tabsClassName?: string;
}

export function TabBar({ label, children, className = '', actions, actionsClassName = '', tabsClassName = '' }: TabBarProps) {
  return (
    <nav className={`flex min-w-0 items-center gap-2 ${className}`.trim()} aria-label={label}>
      <div className="min-w-0 flex-1 overflow-x-auto scrollbar-hidden">
        <div className={`flex w-max items-center gap-0.5 ${tabsClassName}`.trim()} role="tablist" aria-label={label}>
          {children}
        </div>
      </div>
      {actions ? <div className={`flex shrink-0 items-center gap-1 ${actionsClassName}`.trim()}>{actions}</div> : null}
    </nav>
  );
}

interface TabProps {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}

export function Tab({ active, onClick, children, className = '' }: TabProps) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`-mb-px border-0 border-b-2 px-2 py-1.5 text-sm leading-tight cursor-pointer transition-colors ${
        active
          ? 'border-b-selected text-text-primary font-medium'
          : 'border-b-transparent text-text-tertiary hover:text-text-secondary'
      } ${className}`}
    >
      {children}
    </button>
  );
}
