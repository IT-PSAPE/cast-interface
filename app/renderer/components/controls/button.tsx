import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@renderer/utils/cn';
import { cv } from '@renderer/utils/cv';

export type ButtonVariant = 'default' | 'take' | 'danger' | 'ghost';
export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon-sm' | 'icon-md' | 'icon-lg';

const buttonVariants = cv({
  base: ['cursor-pointer transition-colors'],
  variants: {
    variant: {
      default: ['bg-background-tertiary text-text-primary'],
      take: ['bg-background-success_primary text-text-primary'],
      danger: ['bg-background-error_primary text-text-primary'],
      ghost: ['bg-transparent text-text-secondary'],
    },
    size: {
      default: ['rounded px-1.5 py-0.5 text-center text-sm leading-tight'],
      sm: ['rounded px-1 py-px text-center text-xs leading-tight'],
      lg: ['rounded px-3 py-1 text-center text-sm leading-tight'],
      'icon-sm': ['rounded-md h-5 w-5 p-0.5 grid place-items-center'],
      'icon-md': ['rounded-md h-7 w-7 p-1 grid place-items-center'],
      'icon-lg': ['rounded-md h-8 w-8 p-1.5 grid place-items-center'],
    },
    disabled: {
      true: ['opacity-50 cursor-not-allowed pointer-events-none'],
      false: [],
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
    disabled: 'false',
  },
});

const activeOverrides: Record<ButtonVariant, string> = {
  default: 'bg-background-quaternary text-text-primary',
  take: 'bg-background-success_primary text-text-primary',
  danger: 'bg-background-error_primary text-text-primary',
  ghost: 'bg-background-active text-text-primary',
};

const hoverStyles: Record<ButtonVariant, string> = {
  default: 'hover:border-focus hover:text-text-primary',
  take: '',
  danger: '',
  ghost: 'hover:text-text-primary',
};

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  active?: boolean;
  label?: string;
  children: ReactNode;
  className?: string;
}

export function Button({ variant = 'default', size = 'default', active = false, label, children, className, disabled = false, type = 'button', ...buttonProps }: ButtonProps) {
  const isIconSize = size.startsWith('icon-');
  return (
    <button
      type={type}
      disabled={disabled}
      aria-label={label}
      title={label}
      {...buttonProps}
      className={cn(
        buttonVariants({ variant, size, disabled: disabled ? 'true' : 'false' }),
        active && activeOverrides[variant],
        isIconSize && hoverStyles[variant],
        className,
      )}
    >
      {children}
    </button>
  );
}
