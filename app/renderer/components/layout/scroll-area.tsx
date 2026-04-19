import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { cn } from '@renderer/utils/cn';

interface ScrollAreaContextValue {
  register: (element: HTMLElement | null) => void;
}

const ScrollAreaContext = createContext<ScrollAreaContextValue | null>(null);

type ScrollPadding = number | `${number}%`;

interface ScrollAreaProps {
  className?: string;
  children: ReactNode;
  role?: string;
  'aria-label'?: string;
  scrollPadding?: ScrollPadding;
}

export function ScrollArea({ className, children, scrollPadding = 0, ...rest }: ScrollAreaProps) {
  const containerRef = useRef<HTMLElement | null>(null);
  const paddingRef = useRef<ScrollPadding>(scrollPadding);
  paddingRef.current = scrollPadding;

  const register = useCallback((element: HTMLElement | null) => {
    const container = containerRef.current;
    if (!element || !container) return;
    const c = container.getBoundingClientRect();
    const e = element.getBoundingClientRect();
    const padding = resolvePadding(paddingRef.current, c.height);
    const above = e.top < c.top + padding;
    const below = e.bottom > c.bottom - padding;
    if (!above && !below) return;
    const delta = above ? e.top - c.top - padding : e.bottom - c.bottom + padding;
    container.scrollBy({ top: delta });
  }, []);

  const value = useMemo<ScrollAreaContextValue>(() => ({ register }), [register]);

  return (
    <ScrollAreaContext.Provider value={value}>
      <section ref={containerRef} className={cn('h-full min-h-0 overflow-y-auto', className)} {...rest}>
        {children}
      </section>
    </ScrollAreaContext.Provider>
  );
}

function resolvePadding(padding: ScrollPadding, containerHeight: number): number {
  if (typeof padding === 'number') return padding;
  const numeric = parseFloat(padding);
  if (Number.isNaN(numeric)) return 0;
  return (numeric / 100) * containerHeight;
}

export function useScrollAreaActiveItem(isActive: boolean) {
  const ctx = useContext(ScrollAreaContext);
  if (!ctx) throw new Error('useScrollAreaActiveItem must be used within a ScrollArea');
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isActive) ctx.register(ref.current);
  }, [isActive, ctx]);

  return ref;
}
