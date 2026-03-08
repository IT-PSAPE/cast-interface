import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className'> {
  children: ReactNode;
  className?: string;
  label: string;
}

export function IconButton({ children, className = '', disabled = false, label, type = 'button', ...buttonProps }: IconButtonProps) {
  const disabledClass = disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'hover:border-brand hover:text-text-primary';

  return (
    <button
      type={type}
      disabled={disabled}
      aria-label={label}
      title={label}
      {...buttonProps}
      className={`grid h-6 w-6 place-items-center rounded border border-border-primary bg-background-tertiary text-text-secondary transition-colors ${disabledClass} ${className}`}
    >
      {children}
    </button>
  );
}
