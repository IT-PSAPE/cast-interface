import type { ReactNode } from 'react';
import { cn } from '@renderer/utils/cn';

interface FieldLabelProps {
  label: string;
  wide?: boolean;
  children: ReactNode;
}

export function FieldLabel({ label, wide, children }: FieldLabelProps) {
  return (
    <label className={cn('grid min-w-0 gap-0.5 text-sm text-text-secondary', wide && 'col-span-full')}>
      <span className="truncate">{label}</span>
      {children}
    </label>
  );
}
