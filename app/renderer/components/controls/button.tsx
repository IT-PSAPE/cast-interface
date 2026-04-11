import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@renderer/utils/cn';
import { cv } from '@renderer/utils/cv';

export type ButtonVariant = 'default' | 'take' | 'danger' | 'ghost';
export type ButtonSize = 'default' | 'sm' | 'lg';
export type IconButtonSize = 'sm' | 'md' | 'lg';

const buttonVariants = cv({
  base: 'cursor-pointer transition-colors',
  variants: {
    variant: {
      default: 'bg-background-tertiary text-text-primary hover:border-focus hover:text-text-primary',
      take: 'bg-background-success_primary text-text-primary',
      danger: 'bg-background-error_primary text-text-primary',
      ghost: 'bg-transparent text-text-secondary hover:text-text-primary',
    },
    size: {
      default: 'rounded px-1.5 py-0.5 text-center text-sm leading-tight',
      sm: 'rounded px-1 py-px text-center text-xs leading-tight',
      lg: 'rounded px-3 py-1 text-center text-sm leading-tight',
    },
    disabled: {
      true: 'opacity-50 cursor-not-allowed pointer-events-none',
      false: null,
    },
    active: {
      true: null,
      false: null,
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
    disabled: false,
    active: false,
  },
  compoundVariants: [
    { variant: 'default', active: true, className: 'bg-background-quaternary text-text-primary' },
    { variant: 'take', active: true, className: 'bg-background-success_primary text-text-primary' },
    { variant: 'danger', active: true, className: 'bg-background-error_primary text-text-primary' },
    { variant: 'ghost', active: true, className: 'bg-background-active text-text-primary' },
  ],
});

const iconButtonVariants = cv({
  base: 'cursor-pointer transition-colors',
  variants: {
    variant: {
      default: 'bg-background-tertiary text-text-primary hover:border-focus hover:text-text-primary',
      take: 'bg-background-success_primary text-text-primary',
      danger: 'bg-background-error_primary text-text-primary',
      ghost: 'bg-transparent text-text-secondary hover:text-text-primary',
    },
    size: {
      sm: 'rounded-md h-5 w-5 p-0.5 grid place-items-center',
      md: 'rounded-md h-7 w-7 p-1 grid place-items-center',
      lg: 'rounded-md h-8 w-8 p-1.5 grid place-items-center',
    },
    disabled: {
      true: 'opacity-50 cursor-not-allowed pointer-events-none',
      false: null,
    },
    active: {
      true: null,
      false: null,
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'sm',
    disabled: false,
    active: false,
  },
  compoundVariants: [
    { variant: 'default', active: true, className: 'bg-background-quaternary text-text-primary' },
    { variant: 'take', active: true, className: 'bg-background-success_primary text-text-primary' },
    { variant: 'danger', active: true, className: 'bg-background-error_primary text-text-primary' },
    { variant: 'ghost', active: true, className: 'bg-background-active text-text-primary' },
  ],
});

interface ButtonRootProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className'> {
  active?: boolean;
  children: ReactNode;
  className?: string;
  label?: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
}

function Root({ active = false, children, className, disabled = false, label, size = 'default', type = 'button', variant = 'default', ...buttonProps }: ButtonRootProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      aria-label={label}
      title={label}
      {...buttonProps}
      className={cn(buttonVariants({ active, disabled, size, variant }), className)}
    >
      {children}
    </button>
  );
}

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className'> {
  active?: boolean;
  children: ReactNode;
  className?: string;
  label: string;
  size?: IconButtonSize;
  variant?: ButtonVariant;
}

function Icon({ active = false, children, className, disabled = false, label, size = 'sm', type = 'button', variant = 'default', ...buttonProps }: IconButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      aria-label={label}
      title={label}
      {...buttonProps}
      className={cn(iconButtonVariants({ active, disabled, size, variant }), className)}
    >
      {children}
    </button>
  );
}

export const Button = { Root, Icon };
