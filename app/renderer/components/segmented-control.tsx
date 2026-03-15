import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export type SegmentedControlSelectionMode = 'single' | 'multiple';
export type SegmentedControlValue = string | string[];
export type SegmentedControlItemVariant = 'icon' | 'label';

interface SegmentedControlProps {
  label: string;
  children: ReactNode;
  className?: string;
  selectionMode?: SegmentedControlSelectionMode;
  value?: SegmentedControlValue;
  defaultValue?: SegmentedControlValue;
  onValueChange?: (value: SegmentedControlValue) => void;
}

interface SegmentedControlItemProps {
  value?: string;
  title: string;
  children: ReactNode;
  variant?: SegmentedControlItemVariant;
  disabled?: boolean;
  active?: boolean;
  onClick?: () => void;
}

interface SegmentedControlItemSlotProps {
  children: ReactNode;
}

interface SegmentedControlContextValue {
  grouped: boolean;
  selectionMode: SegmentedControlSelectionMode;
  selectedValues: string[];
  toggleValue: (value: string) => void;
}

const SegmentedControlContext = createContext<SegmentedControlContextValue | null>(null);

export function SegmentedControl({ label, children, className = '', selectionMode = 'single', value, defaultValue, onValueChange }: SegmentedControlProps) {
  const controlled = typeof value !== 'undefined';
  const [internalValue, setInternalValue] = useState<SegmentedControlValue>(() => {
    if (typeof defaultValue !== 'undefined') return defaultValue;
    return selectionMode === 'multiple' ? [] : '';
  });

  const currentValue = controlled ? value : internalValue;
  const selectedValues = useMemo(
    () => normalizeSelection(currentValue, selectionMode),
    [currentValue, selectionMode],
  );

  function emitValue(nextValues: string[]) {
    const nextValue = selectionMode === 'multiple' ? nextValues : (nextValues[0] ?? '');
    if (!controlled) {
      setInternalValue(nextValue);
    }
    onValueChange?.(nextValue);
  }

  function handleItemToggle(nextValue: string) {
    if (selectionMode === 'multiple') {
      const nextValues = selectedValues.includes(nextValue)
        ? selectedValues.filter((valueEntry) => valueEntry !== nextValue)
        : [...selectedValues, nextValue];
      emitValue(nextValues);
      return;
    }

    emitValue(selectedValues.includes(nextValue) ? [] : [nextValue]);
  }

  const contextValue = useMemo<SegmentedControlContextValue>(() => ({
    grouped: true,
    selectionMode,
    selectedValues,
    toggleValue: handleItemToggle,
  }), [selectedValues, selectionMode]);

  return (
    <SegmentedControlContext.Provider value={contextValue}>
      <div
        role="group"
        aria-label={label}
        className={`inline-flex items-center rounded-lg bg-background-tertiary/40 p-0.5 ${className}`}
      >
        {children}
      </div>
    </SegmentedControlContext.Provider>
  );
}

export function SegmentedControlItem({ value, title, children, variant = 'label', disabled = false, active, onClick }: SegmentedControlItemProps) {
  const context = useContext(SegmentedControlContext);
  const grouped = Boolean(context?.grouped && value);
  const groupedContext = grouped ? context : null;
  const isPressed = groupedContext && value ? groupedContext.selectedValues.includes(value) : Boolean(active);

  function handleClick() {
    if (disabled) return;
    if (groupedContext && value) {
      groupedContext.toggleValue(value);
    }
    onClick?.();
  }

  const paddingClass = variant === 'icon'
    ? 'min-w-7 px-1.5'
    : 'px-3';
  const stateClass = isPressed
    ? 'border border-border-primary bg-background-primary text-text-primary'
    : 'border border-transparent bg-transparent text-text-tertiary hover:text-text-secondary';

  return (
    <button
      type="button"
      title={title}
      aria-pressed={isPressed}
      onClick={handleClick}
      disabled={disabled}
      className={`grid h-7 place-items-center rounded-md text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${paddingClass} ${stateClass}`}
    >
      {children}
    </button>
  );
}

export function SegmentedControlItemIcon({ children }: SegmentedControlItemSlotProps) {
  return (
    <span className="inline-flex h-4 w-4 items-center justify-center" aria-hidden="true">
      {children}
    </span>
  );
}

export function SegmentedControlItemLabel({ children }: SegmentedControlItemSlotProps) {
  return <span className="inline-flex items-center justify-center leading-none">{children}</span>;
}

export function useSegmentedControl() {
  const context = useContext(SegmentedControlContext);
  if (!context) throw new Error('useSegmentedControl must be used within SegmentedControl');
  return context;
}

function normalizeSelection(value: SegmentedControlValue | undefined, selectionMode: SegmentedControlSelectionMode): string[] {
  if (typeof value === 'undefined') return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  if (selectionMode === 'multiple') return value ? [value] : [];
  return value ? [value] : [];
}
