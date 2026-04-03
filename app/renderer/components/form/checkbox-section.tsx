import type { ReactNode } from 'react';
import { CheckboxField } from './checkbox-field';

interface CheckboxSectionProps {
  label: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  children?: ReactNode;
  className?: string;
}

export function CheckboxSection({ label, enabled, onToggle, children, className = '' }: CheckboxSectionProps) {
  return (
    <section className={`grid gap-1.5 border-b border-border-secondary ${enabled ? 'pb-3' : ''} ${className}`}>
      <div className='h-10 px-2 flex items-center'>
        <CheckboxField checked={enabled} label={label} onChange={onToggle} />
      </div>
      {enabled ? children : null}
    </section>
  );
}
