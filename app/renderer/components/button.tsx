import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'default' | 'take' | 'danger' | 'ghost';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  default: 'bg-background-tertiary text-text-primary',
  take: 'bg-background-success_primary text-text-primary',
  danger: 'bg-background-error_primary text-text-primary',
  ghost: 'bg-transparent text-text-secondary',
};

const ACTIVE_CLASSES: Record<ButtonVariant, string> = {
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

export function Button({
  variant = 'default',
  active = false,
  children,
  className = '',
  disabled = false,
  type = 'button',
  ...buttonProps
}: ButtonProps) {
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : '';
  const stateClasses = active ? ACTIVE_CLASSES[variant] : VARIANT_CLASSES[variant];

  return (
    <button
      type={type}
      disabled={disabled}
      {...buttonProps}
      className={`rounded px-1.5 py-0.5 text-center text-sm leading-tight cursor-pointer transition-colors ${stateClasses} ${disabledClasses} ${className}`}
    >
      {children}
    </button>
  );
}
