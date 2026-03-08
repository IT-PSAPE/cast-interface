import type { ReactNode } from 'react';

interface PanelSectionProps {
  title: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
}

export function PanelSection({ title, action, children, className = '', headerClassName = '', bodyClassName = '' }: PanelSectionProps) {
  return (
    <section className={`flex h-full min-h-0 flex-col overflow-hidden ${className}`.trim()}>
      <header className={`flex h-8 items-center gap-2 px-2 ${headerClassName}`.trim()}>
        <div className="min-w-0 flex-1">{title}</div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>

      <div className={`min-h-0 flex-1 ${bodyClassName}`.trim()}>
        {children}
      </div>
    </section>
  );
}
