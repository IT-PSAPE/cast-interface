import type { ReactNode } from 'react';

interface ToggleSectionProps {
  label: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  children?: ReactNode;
  className?: string;
}

export function ToggleSection({ label, enabled, onToggle, children, className = '' }: ToggleSectionProps) {
  function handleToggle(event: React.ChangeEvent<HTMLInputElement>) {
    onToggle(event.target.checked);
  }

  return (
    <section className={`grid gap-1.5 border-t border-stroke-light pt-1.5 ${className}`}>
      <label className="flex items-center gap-2 text-[12px] text-text-secondary">
        <input type="checkbox" checked={enabled} onChange={handleToggle} />
        <span>{label}</span>
      </label>
      {enabled ? children : null}
    </section>
  );
}
