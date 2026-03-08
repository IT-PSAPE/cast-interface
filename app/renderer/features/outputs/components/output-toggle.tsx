import type { MouseEventHandler } from 'react';
import { Button } from '../../../components/button';

interface OutputToggleProps {
  label: string;
  active: boolean;
  onClick: MouseEventHandler<HTMLButtonElement>;
}

export function OutputToggle({ label, active, onClick }: OutputToggleProps) {
  const dotColor = active ? 'bg-green-500' : 'bg-red-500';
  const borderColor = active ? 'border-green-500/40' : 'border-red-500/40';

  return (
    <Button
      variant="ghost"
      onClick={onClick}
      type="button"
      className={`flex items-center gap-1.5 rounded border ${borderColor} bg-background-tertiary px-2 py-1 text-[12px] cursor-pointer transition-colors hover:border-text-muted`}
      aria-pressed={active}
    >
      <span className={`inline-block h-2 w-2 rounded-full ${dotColor} transition-colors`} aria-hidden="true" />
      <span className="text-text-primary">{label}</span>
    </Button>
  );
}
