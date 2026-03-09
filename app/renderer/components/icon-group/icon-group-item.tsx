import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@renderer/utils/cn';
import { cv } from '@renderer/utils/cv';

const iconGroupItemStyles = cv({
  base: 'flex min-h-7 flex-1 items-center justify-center bg-tertiary px-2 text-text-secondary transition-colors hover:bg-background-quaternary hover:text-text-primary disabled:pointer-events-none disabled:opacity-50',
});

interface IconGroupItemProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  children: ReactNode;
}

export function IconGroupItem({ children, className, disabled = false, type = 'button', ...buttonProps }: IconGroupItemProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      {...buttonProps}
      className={cn(iconGroupItemStyles(), className)}
    >
      {children}
    </button>
  );
}
