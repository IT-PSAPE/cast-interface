import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type IconButtonSize = 'sm' | 'md' | 'lg';
export type IconButtonVariant = 'default' | 'ghost';

const SIZE_CLASSES: Record<IconButtonSize, string> = {
  sm: 'h-5 w-5 p-0.5',
  md: 'h-7 w-7 p-1',
  lg: 'h-8 w-8 p-1.5',
};

const VARIANT_CLASSES: Record<IconButtonVariant, string> = {
  default: 'bg-background-tertiary text-text-secondary hover:border-focus hover:text-text-primary',
  ghost: 'bg-transparent text-text-secondary hover:text-text-primary',
};

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className'> {
  children: ReactNode;
  className?: string;
  label?: string;
  size?: IconButtonSize;
  variant?: IconButtonVariant;
}

export function IconButton({ children, className = '', disabled = false, label, size = 'md', variant = 'default', type = 'button', ...buttonProps }: IconButtonProps) {
  const disabledClass = disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : '';

  return (
    <button
      type={type}
      disabled={disabled}
      aria-label={label}
      title={label}
      {...buttonProps}
      className={`grid place-items-center rounded-md transition-colors ${SIZE_CLASSES[size]} ${VARIANT_CLASSES[variant]} ${disabledClass} ${className}`}
    >
      {children}
    </button>
  );
}
