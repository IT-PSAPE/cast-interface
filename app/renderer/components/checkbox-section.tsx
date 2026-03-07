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
    <section className={`grid gap-1.5 border-t border-stroke-light pt-1.5 ${className}`}>
      <CheckboxField checked={enabled} label={label} onChange={onToggle} />
      {enabled ? children : null}
    </section>
  );
}
