import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@renderer/utils/cn';
import { useSectionHeaderContext } from './section-header-context';

export function SectionHeaderBody({ children, className, ...divProps }: HTMLAttributes<HTMLDivElement>) {
  const { meta } = useSectionHeaderContext();
  const verticalPadding = meta.density === 'compact' ? 'py-1.5' : 'py-2';

  return (
    <div {...divProps} className={cn('min-w-0 flex-1 px-1', verticalPadding, className)} >
      {children}
    </div>
  );
}
