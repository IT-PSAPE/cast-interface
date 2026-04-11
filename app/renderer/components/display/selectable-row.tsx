import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@renderer/utils/cn';
import { cv } from '@renderer/utils/cv';

const selectableRowStyles = cv({
  base: 'flex h-7 w-full items-center gap-2 rounded px-1.5 text-left transition-colors',
  variants: {
    selected: {
      true: ['bg-background-active text-text-primary'],
      false: ['text-text-secondary hover:bg-background-tertiary/55'],
    },
  },
  defaultVariants: {
    selected: false,
  },
});

interface SelectableRowProps extends Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'draggable' | 'onDragEnd' | 'onDragOver' | 'onDragStart' | 'onDrop'> {
  selected: boolean;
  leading?: ReactNode;
  title: string;
  onClick: () => void;
  trailing?: ReactNode;
  className?: string;
}

export function SelectableRow({
  selected,
  leading,
  title,
  onClick,
  trailing,
  className,
  draggable,
  onDragEnd,
  onDragOver,
  onDragStart,
  onDrop,
}: SelectableRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(selectableRowStyles({ selected }), className)}
      draggable={draggable}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDragStart={onDragStart}
      onDrop={onDrop}
    >
      {leading}
      <span className="min-w-0 flex-1 truncate text-sm font-medium">{title}</span>
      {trailing}
    </button>
  );
}
