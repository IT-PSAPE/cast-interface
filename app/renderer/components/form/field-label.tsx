import type { ReactNode } from 'react';

const LABEL_CLASS = 'grid min-w-0 gap-0.5 text-sm text-text-secondary';

interface FieldLabelProps {
  label: string;
  wide?: boolean;
  children: ReactNode;
}

export function FieldLabel({ label, wide, children }: FieldLabelProps) {
  return (
    <label className={`${LABEL_CLASS} ${wide ? 'col-span-full' : ''}`}>
      <span className="truncate">{label}</span>
      {children}
    </label>
  );
}
