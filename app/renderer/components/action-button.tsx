import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'default' | 'take' | 'danger' | 'ghost';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  default: 'bg-surface-2 border-stroke hover:border-focus text-text-primary',
  take: 'bg-take border-take-border hover:brightness-110 text-text-primary',
  danger: 'bg-danger border-danger-border hover:brightness-110 text-text-primary',
  ghost: 'bg-transparent border-transparent hover:border-stroke text-text-secondary',
};

interface ActionButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className'> {
  variant?: ButtonVariant;
  children: ReactNode;
  className?: string;
}

export function ActionButton({
  variant = 'default',
  children,
  className = '',
  disabled = false,
  type = 'button',
  ...buttonProps
}: ActionButtonProps) {
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : '';

  return (
    <button
      type={type}
      disabled={disabled}
      {...buttonProps}
      className={`rounded border px-1.5 py-0.5 text-[12px] leading-tight cursor-pointer transition-colors ${VARIANT_CLASSES[variant]} ${disabledClasses} ${className}`}
    >
      {children}
    </button>
  );
}
