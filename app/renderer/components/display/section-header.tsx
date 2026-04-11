import { createContext, useContext, useMemo, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@renderer/utils/cn';

type SectionHeaderDensity = 'comfortable' | 'compact';

const SectionHeaderContext = createContext<{ density: SectionHeaderDensity } | null>(null);

function useDensity(): SectionHeaderDensity {
  const ctx = useContext(SectionHeaderContext);
  if (!ctx) throw new Error('SectionHeader components must be used within SectionHeader.Root');
  return ctx.density;
}

interface RootProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  children: ReactNode;
  density?: SectionHeaderDensity;
  bordered?: boolean;
}

function Root({ children, className, density = 'comfortable', bordered = true, ...divProps }: RootProps) {
  const value = useMemo(() => ({ density }), [density]);

  return (
    <SectionHeaderContext.Provider value={value}>
      <div
        {...divProps}
        className={cn('flex items-center bg-primary text-secondary', bordered && 'border-b border-primary', className)}
      >
        {children}
      </div>
    </SectionHeaderContext.Provider>
  );
}

function Leading({ children, className, ...divProps }: HTMLAttributes<HTMLDivElement>) {
  const density = useDensity();
  return (
    <div {...divProps} className={cn('flex shrink-0 items-center pl-1.5 pr-1', density === 'compact' ? 'py-1' : 'py-1.5', className)}>
      {children}
    </div>
  );
}

function Body({ children, className, ...divProps }: HTMLAttributes<HTMLDivElement>) {
  const density = useDensity();
  return (
    <div {...divProps} className={cn('min-w-0 flex-1 px-1', density === 'compact' ? 'py-1.5' : 'py-2', className)}>
      {children}
    </div>
  );
}

function Trailing({ children, className, ...divProps }: HTMLAttributes<HTMLDivElement>) {
  const density = useDensity();
  return (
    <div {...divProps} className={cn('flex shrink-0 items-center pl-1 pr-1.5', density === 'compact' ? 'py-1' : 'py-1.5', className)}>
      {children}
    </div>
  );
}

export const SectionHeader = { Root, Leading, Body, Trailing };
