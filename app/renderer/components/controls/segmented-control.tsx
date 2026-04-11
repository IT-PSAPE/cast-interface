import { createContext, useCallback, useContext, useMemo, useState, type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@renderer/utils/cn';
import { cv } from '@renderer/utils/cv';

type SelectionMode = 'single' | 'multiple';
type Value = string | string[];

const rootStyles = cv({
  base: 'flex items-center gap-px rounded-md bg-tertiary/40 p-0.5',
  variants: {
    fill: { true: 'w-full', false: 'w-fit' },
  },
  defaultVariants: { fill: false },
});

const itemStyles = cv({
  base: 'inline-flex items-center justify-center rounded-sm border transition-colors disabled:pointer-events-none disabled:opacity-50',
  variants: {
    active: {
      true: 'border-primary bg-primary text-primary',
      false: 'border-transparent text-tertiary hover:border-secondary hover:text-secondary',
    },
    fill: { true: 'w-full', false: 'w-fit' },
    variant: {
      icon: 'p-1',
      label: 'px-3 py-1 label-xs',
    },
  },
  defaultVariants: { active: false, fill: false, variant: 'label' },
});

interface ContextValue {
  fill: boolean;
  selectedValues: string[];
  onToggle: (value: string) => void;
}

const SegmentContext = createContext<ContextValue | null>(null);

function useSegmentContext() {
  const context = useContext(SegmentContext);
  if (!context) throw new Error('SegmentedControl children must be used within SegmentedControl');
  return context;
}

function normalizeToArray(value: Value | undefined): string[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : value ? [value] : [];
}

interface RootProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onChange'> {
  children: ReactNode;
  value?: Value;
  defaultValue?: Value;
  onValueChange?: (value: Value) => void;
  selectionMode?: SelectionMode;
  fill?: boolean;
  label?: string;
}

interface ItemProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'onClick' | 'value'> {
  children: ReactNode;
  value: string;
  fill?: boolean;
  onClick?: () => void;
}

function Root({ children, value, defaultValue, onValueChange, selectionMode = 'single', fill = false, label, className, ...rest }: RootProps) {
  const [internalValue, setInternalValue] = useState<string[]>(() => normalizeToArray(defaultValue));
  const isControlled = value !== undefined;
  const selectedValues = isControlled ? normalizeToArray(value) : internalValue;

  const handleToggle = useCallback((toggled: string) => {
    const next = selectionMode === 'multiple'
      ? selectedValues.includes(toggled) ? selectedValues.filter((v) => v !== toggled) : [...selectedValues, toggled]
      : selectedValues.includes(toggled) ? [] : [toggled];

    if (!isControlled) setInternalValue(next);
    onValueChange?.(selectionMode === 'multiple' ? next : (next[0] ?? ''));
  }, [isControlled, onValueChange, selectedValues, selectionMode]);

  const ctx = useMemo(() => ({ fill, selectedValues, onToggle: handleToggle }), [fill, handleToggle, selectedValues]);

  return (
    <SegmentContext.Provider value={ctx}>
      <div {...rest} role="group" aria-label={label} className={cn(rootStyles({ fill }), className)}>
        {children}
      </div>
    </SegmentContext.Provider>
  );
}

function Item({ children, value, fill, onClick, className, disabled, variant, type = 'button', ...rest }: ItemProps & { variant: 'icon' | 'label' }) {
  const ctx = useSegmentContext();
  const isActive = ctx.selectedValues.includes(value);

  const handleClick = useCallback(() => {
    if (disabled) return;
    ctx.onToggle(value);
    onClick?.();
  }, [ctx, disabled, onClick, value]);

  return (
    <button type={type} {...rest} onClick={handleClick} disabled={disabled} aria-pressed={isActive} className={cn(itemStyles({ active: isActive, fill: fill ?? ctx.fill, variant }), className)}>
      {children}
    </button>
  );
}

function Label(props: ItemProps) {
  return <Item {...props} variant="label" />;
}

function Icon(props: ItemProps) {
  return <Item {...props} variant="icon" />;
}

export const SegmentedControl = Object.assign(Root, { Label, Icon });
