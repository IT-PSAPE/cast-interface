import { useCallback, useMemo, useState, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@renderer/utils/cn';
import { cv } from '@renderer/utils/cv';
import { SegmentContext } from './segment-context';

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

interface SegmentedControlRootProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onChange'> {
  children: ReactNode;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  fill?: boolean;
}

export function SegmentedControl({ children, value, defaultValue, onValueChange, fill = false, className, ...divProps }: SegmentedControlRootProps) {
  const [internalValue, setInternalValue] = useState<string | null>(defaultValue ?? null);
  const isControlled = value !== undefined;
  const selectedValue = isControlled ? value ?? null : internalValue;

  const handleItemSelect = useCallback((nextValue: string) => {
    if (!isControlled) {
      setInternalValue(nextValue);
    }
    onValueChange?.(nextValue);
  }, [isControlled, onValueChange]);

  const contextValue = useMemo(
    () => ({ fill, onItemSelect: handleItemSelect, value: selectedValue }),
    [fill, handleItemSelect, selectedValue],
  );

  return (
    <SegmentContext.Provider value={contextValue}>
      <div role="group" {...divProps} className={cn(segmentedControlRootStyles({ fill: fill ? 'true' : 'false' }), className)} >
        {children}
      </div>
    </SegmentContext.Provider>
  );
}
