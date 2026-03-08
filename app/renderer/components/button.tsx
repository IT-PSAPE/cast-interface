import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'default' | 'take' | 'danger' | 'ghost';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  default: 'bg-background-tertiary border-border-primary hover:border-brand text-text-primary',
  take: 'bg-background-success_primary border-green-500 hover:brightness-110 text-text-primary',
  danger: 'bg-background-error_primary border-red-400 hover:brightness-110 text-text-primary',
  ghost: 'bg-transparent border-transparent hover:border-border-primary text-text-secondary',
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
      className={`rounded border px-1.5 py-0.5 text-left text-[12px] leading-tight cursor-pointer transition-colors ${VARIANT_CLASSES[variant]} ${disabledClasses} ${className}`}
    >
      {children}
    </button>
  );
}
