import { useCallback, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@renderer/utils/cn';
import { cv } from '@renderer/utils/cv';
import { useSegment } from './segment-context';

const segmentedControlItemStyles = cv({
  base: 'inline-flex items-center justify-center rounded-md border text-[12px] transition-colors disabled:pointer-events-none disabled:opacity-50',
  variants: {
    active: {
      true: ['border-border-primary bg-background-primary text-text-primary'],
      false: ['border-transparent text-text-tertiary hover:border-border-secondary hover:text-text-secondary'],
    },
    fill: {
      true: ['w-full'],
      false: ['w-fit'],
    },
    variant: {
      icon: ['min-h-7 min-w-7 px-1.5'],
      label: ['min-h-7 px-3 font-medium'],
    },
  },
  defaultVariants: {
    active: 'false',
    fill: 'false',
    variant: 'label',
  },
});

interface SegmentedControlItemBaseProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'onClick' | 'value'> {
  children: ReactNode;
  value: string;
  variant: 'icon' | 'label';
  fill?: boolean;
  onClick?: () => void;
}

export function SegmentedControlItemBase({ children, value, variant, fill, onClick, className, disabled = false, type = 'button', ...buttonProps }: SegmentedControlItemBaseProps) {
  const segmentedControl = useSegment();
  const shouldFill = fill ?? segmentedControl.fill;
  const isActive = segmentedControl.selectedValue === value;

  const handleClick = useCallback(() => {
    if (disabled) {
      return;
    }

    segmentedControl.onSelect(value);
    onClick?.();
  }, [disabled, onClick, segmentedControl, value]);

  return (
    <button
      type={type}
      {...buttonProps}
      onClick={handleClick}
      disabled={disabled}
      aria-pressed={isActive}
      className={cn(
        segmentedControlItemStyles({
          active: isActive ? 'true' : 'false',
          fill: shouldFill ? 'true' : 'false',
          variant,
        }),
        className,
      )}
    >
      {children}
    </button>
  );
}
