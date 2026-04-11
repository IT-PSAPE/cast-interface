import type { MouseEventHandler } from 'react';
import { cn } from '@renderer/utils/cn';
import { cv } from '@renderer/utils/cv';
import { Button } from '../../components/controls/button';

const dotStyles = cv({
  base: 'inline-block h-2 w-2 rounded-full transition-colors',
  variants: {
    active: {
      true: ['bg-green-500'],
      false: ['bg-red-500'],
    },
  },
});

const borderStyles = cv({
  base: 'flex items-center gap-1.5 rounded border bg-tertiary px-2 py-1 text-sm cursor-pointer transition-colors hover:border-text-muted',
  variants: {
    active: {
      true: ['border-green-500/40'],
      false: ['border-red-500/40'],
    },
  },
});

interface OutputToggleProps {
  label: string;
  active: boolean;
  onClick: MouseEventHandler<HTMLButtonElement>;
}

export function OutputToggle({ label, active, onClick }: OutputToggleProps) {
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      type="button"
      className={borderStyles({ active })}
      aria-pressed={active}
    >
      <span className={dotStyles({ active })} aria-hidden="true" />
      <span className="text-primary">{label}</span>
    </Button>
  );
}
