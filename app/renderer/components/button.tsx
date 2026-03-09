import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'default' | 'take' | 'danger' | 'ghost';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  default: 'bg-background-tertiary text-text-primary',
  take: 'bg-background-success_primary text-text-primary',
  danger: 'bg-background-error_primary text-text-primary',
  ghost: 'bg-transparent text-text-secondary',
};

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className'> {
  variant?: ButtonVariant;
  children: ReactNode;
  className?: string;
}

export function Button({
  variant = 'default',
  children,
  className = '',
  disabled = false,
  type = 'button',
  ...buttonProps
}: ButtonProps) {
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : '';

  return (
    <button
      type={type}
      disabled={disabled}
      {...buttonProps}
      className={`rounded px-1.5 py-0.5 text-left text-[12px] leading-tight cursor-pointer transition-colors ${VARIANT_CLASSES[variant]} ${disabledClasses} ${className}`}
    >
      {children}
    </button>
  );
}
