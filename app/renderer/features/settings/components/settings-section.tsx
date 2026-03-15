import type { ReactNode } from 'react';
import { cn } from '@renderer/utils/cn';

interface SettingsSectionProps {
  title: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function SettingsSection({ title, children, action, className }: SettingsSectionProps) {
  return (
    <section className={cn('grid gap-3 border-b border-border-primary pb-5 last:border-b-0 last:pb-0', className)}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}
