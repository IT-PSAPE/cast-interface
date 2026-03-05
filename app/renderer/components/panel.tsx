import type { ReactNode } from 'react';

interface PanelProps {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Panel({ title, action, children, className = '' }: PanelProps) {
  return (
    <section className={`rounded-md border border-stroke bg-surface-1 p-2 ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-1.5">
          {title && <h3 className="text-[12px] font-semibold text-text-primary">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
