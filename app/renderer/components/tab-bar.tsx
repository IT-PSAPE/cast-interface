import type { ReactNode } from 'react';

interface TabBarProps {
  label: string;
  children: ReactNode;
}

export function TabBar({ label, children }: TabBarProps) {
  return (
    <div className="flex gap-1" role="tablist" aria-label={label}>
      {children}
    </div>
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
      className={`rounded border px-1.5 py-0.5 text-[12px] leading-tight cursor-pointer transition-colors ${
        active
          ? 'bg-accent border-accent-border text-text-primary font-medium'
          : 'bg-surface-2 border-stroke text-text-secondary hover:border-focus'
      }`}
    >
      {children}
    </button>
  );
}

interface SidebarTabBarProps {
  label: string;
  children: ReactNode;
}

export function SidebarTabBar({ label, children }: SidebarTabBarProps) {
  return (
    <nav className="flex items-center" role="tablist" aria-label={label}>
      {children}
    </nav>
  );
}

interface SidebarTabProps {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}

export function SidebarTab({ active, onClick, children }: SidebarTabProps) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`px-2 py-1.5 text-[12px] cursor-pointer border-0 border-b-2 transition-colors ${
        active
          ? 'border-b-selected text-text-primary bg-transparent'
          : 'border-b-transparent text-text-muted bg-transparent hover:text-text-secondary'
      }`}
    >
      {children}
    </button>
  );
}
