import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { SegmentedControlItemBase } from './segmented-control-item';

interface SegmentLabelProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'onClick' | 'value'> {
  children: ReactNode;
  value: string;
  fill?: boolean;
  onClick?: () => void;
}

export function SegmentLabel({ children, value, fill, onClick, className, disabled, type = 'button', ...buttonProps }: SegmentLabelProps) {
  return (
    <SegmentedControlItemBase
      type={type}
      value={value}
      variant="label"
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
