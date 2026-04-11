import { ButtonHTMLAttributes, useCallback, useMemo, useState, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@renderer/utils/cn';
import { cv } from '@renderer/utils/cv';
import { createContext, useContext } from 'react';
// import { SegmentContext, useSegment, type SegmentSelectionMode } from './segment-context';

const segmentedControlRootStyles = cv({
  base: 'flex items-center gap-px rounded-md bg-tertiary/40 p-0.5',
  variants: {
    fill: {
      true: ['w-full'],
      false: ['w-fit'],
    },
  },
  defaultVariants: {
    fill: false,
  },
});

const segmentedControlItemStyles = cv({
  base: [
    'inline-flex items-center justify-center rounded-md border',
    'transition-colors disabled:pointer-events-none disabled:opacity-50'
  ],
  variants: {
    active: {
      true: ['border-primary bg-primary text-primary'],
      false: ['border-transparent text-tertiary hover:border-secondary hover:text-secondary'],
    },
    fill: {
      true: ['w-full'],
      false: ['w-fit'],
    },
    variant: {
      icon: ['min-h-7 min-w-7 px-1.5'],
      label: ['min-h-7 px-3 label-sm'],
    },
  },
  defaultVariants: {
    active: false,
    fill: false,
    variant: 'label',
  },
});

type SegmentedControlValue = string | string[];

interface SegmentedControlRootProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onChange'> {
  children: ReactNode;
  value?: SegmentedControlValue;
  defaultValue?: SegmentedControlValue;
  onValueChange?: (value: SegmentedControlValue) => void;
  selectionMode?: SegmentSelectionMode;
  fill?: boolean;
  label?: string;
}

interface SegmentedControlItemBaseProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'onClick' | 'value'> {
  children: ReactNode;
  value: string;
  variant: 'icon' | 'label';
  fill?: boolean;
  onClick?: () => void;
}

interface SegmentItemProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'onClick' | 'value'> {
  children: ReactNode;
  value: string;
  fill?: boolean;
  onClick?: () => void;
}

export type SegmentSelectionMode = 'single' | 'multiple';

interface SegmentContextValue {
  fill: boolean;
  selectionMode: SegmentSelectionMode;
  selectedValues: string[];
  onToggle: (value: string) => void;
}

const SegmentContext = createContext<SegmentContextValue | null>(null);

export function useSegment() {
  const context = useContext(SegmentContext);
  if (!context) {
    throw new Error('useSegment must be used within SegmentedControl.Root');
  }
  return context;
}

export { SegmentContext };

function normalizeToArray(value: SegmentedControlValue | undefined): string[] {
  if (value === undefined) return [];
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
}

function SegmentedControlItemBase({ children, value, variant, fill, onClick, className, disabled = false, type = 'button', ...buttonProps }: SegmentedControlItemBaseProps) {
  const segment = useSegment();
  const shouldFill = fill ?? segment.fill;
  const isActive = segment.selectedValues.includes(value);

  const handleClick = useCallback(() => {
    if (disabled) return;
    segment.onToggle(value);
    onClick?.();
  }, [disabled, onClick, segment, value]);

  return (
    <button
      type={type}
      {...buttonProps}
      onClick={handleClick}
      disabled={disabled}
      aria-pressed={isActive}
      className={cn(segmentedControlItemStyles({ active: isActive, fill: shouldFill, variant, }), className)}
    >
      {children}
    </button>
  );
}

export function SegmentedControlRoot({ children, value, defaultValue, onValueChange, selectionMode = 'single', fill = false, label, className, ...divProps }: SegmentedControlRootProps) {
  const [internalValue, setInternalValue] = useState<string[]>(() => normalizeToArray(defaultValue));
  const isControlled = value !== undefined;
  const selectedValues = isControlled ? normalizeToArray(value) : internalValue;

  const handleToggle = useCallback((toggledValue: string) => {
    let nextValues: string[];

    if (selectionMode === 'multiple') {
      nextValues = selectedValues.includes(toggledValue)
        ? selectedValues.filter((v) => v !== toggledValue)
        : [...selectedValues, toggledValue];
    } else {
      nextValues = selectedValues.includes(toggledValue) ? [] : [toggledValue];
    }

    if (!isControlled) {
      setInternalValue(nextValues);
    }

    if (onValueChange) {
      onValueChange(selectionMode === 'multiple' ? nextValues : (nextValues[0] ?? ''));
    }
  }, [isControlled, onValueChange, selectedValues, selectionMode]);

  const contextValue = useMemo(
    () => ({ fill, selectionMode, selectedValues, onToggle: handleToggle }),
    [fill, handleToggle, selectedValues, selectionMode],
  );

  return (
    <SegmentContext.Provider value={contextValue}>
      <div {...divProps} role="group" aria-label={label} className={cn(segmentedControlRootStyles({ fill }), className)} >
        {children}
      </div>
    </SegmentContext.Provider>
  );
}

function SegmentLabel({ children, value, fill, onClick, className, disabled, type = 'button', ...buttonProps }: SegmentItemProps) {
  return (
    <SegmentedControlItemBase type={type} value={value} variant="label" fill={fill} onClick={onClick} className={className} disabled={disabled} {...buttonProps}>
      {children}
    </SegmentedControlItemBase>
  );
}

function SegmentIcon({ children, value, fill, onClick, className, disabled, type = 'button', ...buttonProps }: SegmentItemProps) {
  return (
    <SegmentedControlItemBase type={type} value={value} variant="icon" fill={fill} onClick={onClick} className={className} disabled={disabled} {...buttonProps}>
      {children}
    </SegmentedControlItemBase>
  );
}

export const SegmentedControl = Object.assign(SegmentedControlRoot, {
  Root: SegmentedControlRoot,
  Icon: SegmentIcon,
  Label: SegmentLabel,
});
