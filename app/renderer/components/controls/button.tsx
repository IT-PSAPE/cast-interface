import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@renderer/utils/cn';
import { cv } from '@renderer/utils/cv';

export type ButtonVariant = 'default' | 'take' | 'danger' | 'ghost';

const buttonVariants = cv({
  base: [
    'rounded px-1.5 py-0.5 text-center text-sm leading-tight cursor-pointer transition-colors',
  ],
  variants: {
    variant: {
      default: ['bg-background-tertiary text-text-primary'],
      take: ['bg-background-success_primary text-text-primary'],
      danger: ['bg-background-error_primary text-text-primary'],
      ghost: ['bg-transparent text-text-secondary'],
    },
    active: {
      true: [],
      false: [],
    },
    disabled: {
      true: ['opacity-50 cursor-not-allowed pointer-events-none'],
      false: [],
    },
  },
  defaultVariants: {
    variant: 'default',
    active: 'false',
    disabled: 'false',
  },
});

const activeOverrides: Record<ButtonVariant, string> = {
  default: 'bg-background-quaternary text-text-primary',
  take: 'bg-background-success_primary text-text-primary',
  danger: 'bg-background-error_primary text-text-primary',
  ghost: 'bg-background-active text-text-primary',
};

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className'> {
  variant?: ButtonVariant;
  active?: boolean;
  children: ReactNode;
  className?: string;
}

export function Button({ variant = 'default', active = false, children, className, disabled = false, type = 'button', ...buttonProps }: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      {...buttonProps}
      className={cn(
        buttonVariants({ variant, disabled: disabled ? 'true' : 'false' }),
        active && activeOverrides[variant],
        className,
      )}
    >
      {children}
    </button>
  );
}
