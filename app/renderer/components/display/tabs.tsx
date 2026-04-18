import { createContext, useContext, useEffect, useId, useMemo, useRef, useState, type HTMLAttributes, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '@renderer/utils/cn';
import { cv } from '@renderer/utils/cv';

type TabsOrientation = 'horizontal' | 'vertical';
type TabsActivationMode = 'automatic' | 'manual';

interface TabsContextValue {
  state: { value: string | undefined };
  actions: {
    registerTrigger: (value: string, node: HTMLButtonElement | null) => void;
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

const listStyles = cv({
  base: 'flex min-w-0 items-center gap-2',
  variants: {
    orientation: {
      horizontal: null,
      vertical: 'items-start',
    },
  },
  defaultVariants: {
    orientation: 'horizontal',
  },
});

const tabStyles = cv({
  base: 'cursor-pointer border-0 text-sm leading-tight transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-brand disabled:pointer-events-none disabled:opacity-50',
  variants: {
    active: {
      true: 'text-primary font-medium',
      false: 'text-tertiary hover:text-secondary',
    },
    orientation: {
      horizontal: '-mb-px border-b-2 px-2 py-1.5',
      vertical: 'rounded-md px-2 py-1.5 text-left',
    },
  },
  defaultVariants: {
    active: false,
    orientation: 'horizontal',
  },
  compoundVariants: [
    { active: true, orientation: 'horizontal', className: 'border-b-selected' },
    { active: false, orientation: 'horizontal', className: 'border-b-transparent' },
    { active: true, orientation: 'vertical', className: 'bg-active' },
  ],
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
  const triggerMapRef = useRef(new Map<string, HTMLButtonElement>());

  function setValue(nextValue: string) {
    if (!isControlled) setInternalValue(nextValue);
    onValueChange?.(nextValue);
  }

  function registerTrigger(triggerValue: string, node: HTMLButtonElement | null) {
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

interface BarProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
}

function Bar({ children, className = '', ...rest }: BarProps) {
  const { meta } = useTabs();

  return (
    <div
      className={cn(
        'flex min-w-0 items-center gap-2',
        meta.orientation === 'vertical' ? 'items-start' : '',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

interface ListProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  label: string;
  tabsClassName?: string;
}

function List({ children, className = '', label, tabsClassName = '', ...rest }: ListProps) {
  const { meta } = useTabs();
  const tabsContainerClassName = meta.orientation === 'horizontal'
    ? 'flex w-max items-center gap-0.5'
    : 'flex min-w-[10rem] flex-col gap-0.5';

  return (
    <nav className={listStyles({ orientation: meta.orientation, className })} aria-label={label} {...rest}>
      <div className={cn('min-w-0 flex-1', meta.orientation === 'horizontal' ? 'overflow-x-auto scrollbar-hidden' : '')}>
        <div className={cn('relative', meta.orientation === 'horizontal' ? 'w-max' : 'w-full')}>
          <div className={cn(tabsContainerClassName, tabsClassName)} role="tablist" aria-label={label} aria-orientation={meta.orientation}>
            {children}
          </div>
        </div>
      </div>
    </nav>
  );
}

interface ActionsProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

function Actions({ children, className = '', ...rest }: ActionsProps) {
  return (
    <div className={cn('flex shrink-0 items-center gap-1', className)} {...rest}>
      {children}
    </div>
  );
}

interface TriggerProps extends Omit<HTMLAttributes<HTMLButtonElement>, 'children' | 'onChange'> {
  children: ReactNode;
  disabled?: boolean;
  value: string;
}

function Trigger({ children, className, disabled = false, value, ...rest }: TriggerProps) {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const { actions, meta, state } = useTabs();
  const active = state.value === value;
  const panelId = `${meta.baseId}-panel-${sanitizeTabValue(value)}`;
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

  function handleFocus() {
    if (disabled || meta.activationMode !== 'automatic') return;
    actions.setValue(value);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const list = event.currentTarget.closest('[role="tablist"]');
    if (!list) return;
    const triggers = Array.from(list.querySelectorAll<HTMLButtonElement>('[role="tab"]:not([disabled])'));
    const currentIndex = triggers.findIndex((trigger) => trigger === event.currentTarget);
    if (currentIndex === -1) return;

    const lastIndex = triggers.length - 1;
    const previousKey = meta.orientation === 'horizontal' ? 'ArrowLeft' : 'ArrowUp';
    const nextKey = meta.orientation === 'horizontal' ? 'ArrowRight' : 'ArrowDown';
    let nextIndex = currentIndex;

    if (event.key === previousKey) nextIndex = currentIndex === 0 ? lastIndex : currentIndex - 1;
    if (event.key === nextKey) nextIndex = currentIndex === lastIndex ? 0 : currentIndex + 1;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = lastIndex;
    if (nextIndex === currentIndex && !['Home', 'End', previousKey, nextKey].includes(event.key)) return;

    event.preventDefault();
    const nextTrigger = triggers[nextIndex];
    nextTrigger.focus();
    if (meta.activationMode === 'automatic') {
      nextTrigger.click();
    }
  }

  return (
    <button
      {...rest}
      ref={buttonRef}
      type="button"
      id={triggerId}
      role="tab"
      disabled={disabled}
      aria-controls={panelId}
      aria-selected={active}
      tabIndex={active ? 0 : -1}
      onClick={handleClick}
      onFocus={handleFocus}
      onKeyDown={handleKeyDown}
      data-state={active ? 'active' : 'inactive'}
      className={cn(tabStyles({ active, orientation: meta.orientation }), className)}
    >
      {children}
    </button>
  );
}

interface PanelsProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

function Panels({ children, className = '', ...rest }: PanelsProps) {
  return (
    <div className={className} role="presentation" {...rest}>
      {children}
    </div>
  );
}

interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  value: string;
}

function Panel({ children, className, value, ...rest }: PanelProps) {
  const { meta, state } = useTabs();
  const active = state.value === value;
  if (!active) return null;

  return (
    <div
      {...rest}
      id={`${meta.baseId}-panel-${sanitizeTabValue(value)}`}
      role="tabpanel"
      aria-labelledby={`${meta.baseId}-trigger-${sanitizeTabValue(value)}`}
      className={className}
    >
      {children}
    </div>
  );
}

interface IndicatorProps extends HTMLAttributes<HTMLSpanElement> {}

function Indicator({ className, style, ...rest }: IndicatorProps) {
  const indicatorRef = useRef<HTMLSpanElement | null>(null);
  const { meta, state } = useTabs();

  useEffect(() => {
    const node = indicatorRef.current;
    if (!node || !state.value) return;

    const trigger = document.getElementById(`${meta.baseId}-trigger-${sanitizeTabValue(state.value)}`) as HTMLButtonElement | null;
    if (!trigger) return;

    const horizontalStyle = {
      width: `${trigger.offsetWidth}px`,
      transform: `translateX(${trigger.offsetLeft}px)`,
    };
    const verticalStyle = {
      height: `${trigger.offsetHeight}px`,
      transform: `translateY(${trigger.offsetTop}px)`,
    };

    Object.assign(node.style, meta.orientation === 'horizontal' ? horizontalStyle : verticalStyle);
  }, [meta.baseId, meta.orientation, state.value]);

  return (
    <span
      {...rest}
      ref={indicatorRef}
      aria-hidden="true"
      data-active-value={state.value}
      className={cn(
        'pointer-events-none absolute left-0 rounded-full bg-brand transition-transform duration-150 ease-out',
        meta.orientation === 'horizontal' ? 'bottom-0 h-0.5' : 'top-0 w-0.5',
        className,
      )}
      style={style}
    />
  );
}

export const Tabs = { Root, Bar, List, Actions, Trigger, Panels, Panel, Indicator };
