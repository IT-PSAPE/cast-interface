import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { SegmentedControlItemBase } from './segmented-control-item';

interface SegmentIconProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'onClick' | 'value'> {
  children: ReactNode;
  value: string;
  fill?: boolean;
  onClick?: () => void;
}

export function SegmentIcon({ children, value, fill, onClick, className, disabled, type = 'button', ...buttonProps }: SegmentIconProps) {
  return (
    <SegmentedControlItemBase
      type={type}
      value={value}
      variant="icon"
      fill={fill}
      onClick={onClick}
      className={className}
      disabled={disabled}
      {...buttonProps}
    >
      {children}
    </SegmentedControlItemBase>
  );
}
