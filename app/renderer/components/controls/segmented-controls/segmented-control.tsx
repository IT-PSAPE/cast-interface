import { useCallback, useMemo, useState, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@renderer/utils/cn';
import { cv } from '@renderer/utils/cv';
import { SegmentContext, type SegmentSelectionMode } from './segment-context';

const segmentedControlRootStyles = cv({
  base: 'flex items-center gap-px rounded-md bg-background-tertiary/40 p-0.5',
  variants: {
    fill: {
      true: ['w-full'],
      false: ['w-fit'],
    },
  },
  defaultVariants: {
    fill: 'false',
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

function normalizeToArray(value: SegmentedControlValue | undefined): string[] {
  if (value === undefined) return [];
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
}

export function SegmentedControl({ children, value, defaultValue, onValueChange, selectionMode = 'single', fill = false, label, className, ...divProps }: SegmentedControlRootProps) {
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
      <div
        {...divProps}
        role="group"
        aria-label={label}
        className={cn(segmentedControlRootStyles({ fill: fill ? 'true' : 'false' }), className)}
      >
        {children}
      </div>
    </SegmentContext.Provider>
  );
}
