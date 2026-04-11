import { useMemo, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@renderer/utils/cn';
import { SectionHeaderContext, type SectionHeaderDensity } from './section-header-context';

interface SectionHeaderRootProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  children: ReactNode;
  density?: SectionHeaderDensity;
  bordered?: boolean;
}

export function SectionHeaderRoot({ children, className, density = 'comfortable', bordered = true, ...divProps }: SectionHeaderRootProps) {
  const value = useMemo(() => ({
    state: {},
    actions: {},
    meta: {
      density,
    },
  }), [density]);

  return (
    <SectionHeaderContext.Provider value={value}>
      <div
        {...divProps}
        className={cn(
          'flex items-center bg-primary text-secondary',
          bordered ? 'border-b border-primary' : null,
          className,
        )}
      >
        {children}
      </div>
    </SectionHeaderContext.Provider>
  );
}
