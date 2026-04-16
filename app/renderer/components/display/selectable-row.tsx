import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { cn } from '@renderer/utils/cn';
import { cv } from '@renderer/utils/cv';

const selectableRowStyles = cv({
  base: 'flex h-7 w-full items-center gap-2 rounded px-1.5 text-left transition-colors',
  variants: {
    selected: {
      true: ['bg-active text-primary'],
      false: ['text-secondary hover:bg-tertiary/55'],
    },
  },
  defaultVariants: {
    selected: false,
  },
});

interface SelectableRowRootProps extends Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'draggable' | 'onClick' | 'onDragEnd' | 'onDragOver' | 'onDragStart' | 'onDrop'> {
  children: ReactNode;
  className?: string;
  selected: boolean;
}

interface SelectableRowPartProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
}

function Root({
  children,
  className,
  draggable,
  onClick,
  onDragEnd,
  onDragOver,
  onDragStart,
  onDrop,
  selected,
}: SelectableRowRootProps) {
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
      {children}
    </button>
  );
}

function Leading({ children, className, ...rest }: SelectableRowPartProps) {
  return (
    <span className={cn('shrink-0 text-tertiary', className)} {...rest}>
      {children}
    </span>
  );
}

function Label({ children, className, ...rest }: SelectableRowPartProps) {
  return (
    <span className={cn('min-w-0 flex-1 truncate text-sm font-medium', className)} {...rest}>
      {children}
    </span>
  );
}

function Trailing({ children, className, ...rest }: SelectableRowPartProps) {
  return (
    <span className={cn('ml-auto flex shrink-0 items-center gap-1', className)} {...rest}>
      {children}
    </span>
  );
}

export const SelectableRow = { Root, Leading, Label, Trailing };
