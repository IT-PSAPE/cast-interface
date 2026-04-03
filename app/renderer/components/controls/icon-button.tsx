import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@renderer/utils/cn';
import { cv } from '@renderer/utils/cv';

export type IconButtonSize = 'sm' | 'md' | 'lg';
export type IconButtonVariant = 'default' | 'ghost';

const iconButtonVariants = cv({
  base: [
    'grid place-items-center rounded-md transition-colors',
  ],
  variants: {
    size: {
      sm: ['h-5 w-5 p-0.5'],
      md: ['h-7 w-7 p-1'],
      lg: ['h-8 w-8 p-1.5'],
    },
    variant: {
      default: ['bg-background-tertiary text-text-secondary hover:border-focus hover:text-text-primary'],
      ghost: ['bg-transparent text-text-secondary hover:text-text-primary'],
    },
    disabled: {
      true: ['opacity-50 cursor-not-allowed pointer-events-none'],
      false: [],
    },
  },
  defaultVariants: {
    size: 'md',
    variant: 'default',
    disabled: 'false',
  },
});

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className'> {
  children: ReactNode;
  className?: string;
  label?: string;
  size?: IconButtonSize;
  variant?: IconButtonVariant;
}

export function IconButton({ children, className, disabled = false, label, size = 'md', variant = 'default', type = 'button', ...buttonProps }: IconButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      aria-label={label}
      title={label}
      {...buttonProps}
      className={cn(
        iconButtonVariants({ size, variant, disabled: disabled ? 'true' : 'false' }),
        className,
      )}
    >
      {children}
    </button>
  );
}
