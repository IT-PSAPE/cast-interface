import { createContext, useContext, useEffect, useId, useMemo, useRef, useState, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@renderer/utils/cn';
import { cv } from '@renderer/utils/cv';
import { ScrollArea } from '../layout/scroll-area';

type TabsOrientation = 'horizontal' | 'vertical';
type TabsActivationMode = 'automatic' | 'manual';

interface TabsContextValue {
  state: { value: string | undefined };
  actions: {
    registerTrigger: (value: string, node: HTMLDivElement | null) => void;
    setValue: (value: string) => void;
  };
  meta: {
    activationMode: TabsActivationMode;
    baseId: string;
    orientation: TabsOrientation;
  };
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabs() {
  const context = useContext(TabsContext);
  if (!context) throw new Error('Tabs sub-components must be used within Tabs.Root');
  return context;
}

function sanitizeTabValue(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9_-]+/g, '-');
}

// Inner nav uses max-content sizing so triggers keep their natural width and
// overflow the viewport (which then scrolls) instead of shrinking to fit.
const listStyles = cv({
  base: 'flex items-center gap-2',
  variants: {
    orientation: {
      horizontal: 'w-max',
      vertical: 'h-max flex-col items-start',
    },
  },
  defaultVariants: {
    orientation: 'horizontal',
  },
});

const tabStyles = cv({
  base: 'cursor-pointer leading-tight transition-colors relative h-8 flex items-center justify-center label-xs px-2',
  variants: {
    active: {
      true: 'text-primary',
      false: 'text-tertiary hover:text-secondary',
    }
  },
  defaultVariants: {
    active: false,
  }
});

interface RootProps {
  activationMode?: TabsActivationMode;
  children: ReactNode;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  orientation?: TabsOrientation;
  value?: string;
}

function Root({ activationMode = 'automatic', children, defaultValue, onValueChange, orientation = 'horizontal', value }: RootProps) {
  const baseId = useId();
  const [internalValue, setInternalValue] = useState(defaultValue);
  const isControlled = value !== undefined;
  const resolvedValue = isControlled ? value : internalValue;
  const triggerMapRef = useRef(new Map<string, HTMLDivElement>());

  function setValue(nextValue: string) {
    if (!isControlled) setInternalValue(nextValue);
    onValueChange?.(nextValue);
  }

  function registerTrigger(triggerValue: string, node: HTMLDivElement | null) {
    if (!node) {
      triggerMapRef.current.delete(triggerValue);
      return;
    }
    triggerMapRef.current.set(triggerValue, node);
  }

  const context = useMemo<TabsContextValue>(() => ({
    state: { value: resolvedValue },
    actions: { registerTrigger, setValue },
    meta: { activationMode, baseId, orientation },
  }), [activationMode, baseId, orientation, resolvedValue]);

  return <TabsContext.Provider value={context}>{children}</TabsContext.Provider>;
}

interface ListProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  label: string;
  tabsClassName?: string;
}

function List({ children, className, label, tabsClassName, ...rest }: ListProps) {
  const { meta } = useTabs();
  // Override the ScrollArea.Root default `size-full` so the tab list sizes to
  // its triggers along the cross-axis (h-auto for horizontal, w-auto for vertical).
  const rootSizing = meta.orientation === 'horizontal'
    ? 'h-auto w-full min-w-0'
    : 'w-auto h-full min-h-0';

  return (
    <ScrollArea.Root className={cn(rootSizing, className)}>
      <ScrollArea.Viewport>
        <nav
          className={listStyles({ orientation: meta.orientation, className: tabsClassName })}
          aria-label={label}
          {...rest}
        >
          {children}
        </nav>
      </ScrollArea.Viewport>
    </ScrollArea.Root>
  );
}

interface TriggerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onChange'> {
  children: ReactNode;
  disabled?: boolean;
  value: string;
}

function Trigger({ children, className, disabled = false, value, ...rest }: TriggerProps) {
  const buttonRef = useRef<HTMLDivElement | null>(null);
  const { actions, meta, state } = useTabs();
  const active = state.value === value;
  const triggerId = `${meta.baseId}-trigger-${sanitizeTabValue(value)}`;

  useEffect(() => {
    actions.registerTrigger(value, buttonRef.current);
    return () => {
      actions.registerTrigger(value, null);
    };
  }, [actions, value]);

  function handleClick() {
    if (disabled) return;
    actions.setValue(value);
  }

  return (
    <div
      {...rest}
      ref={buttonRef}
      id={triggerId}
      role="tab"
      onClick={handleClick}
      className={cn(tabStyles({ active }), className)}
    >
      {children}
      {active && <Indicator />}
    </div>
  );
}

function Indicator() {
  return <span className='absolute inset-0 top-auto bg-brand_primary h-[1px]' />;
}

export const Tabs = { Root, List, Trigger, Indicator };
