import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@renderer/utils/cn';
import { useSectionHeaderContext } from './section-header-context';

interface SectionHeaderTrailingProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  children: ReactNode;
}

export function SectionHeaderTrailing({ children, className, ...divProps }: SectionHeaderTrailingProps) {
  const { meta } = useSectionHeaderContext();
  const verticalPadding = meta.density === 'compact' ? 'py-1' : 'py-1.5';

  return (
    <div
      {...divProps}
      className={cn('flex shrink-0 items-center pl-1 pr-1.5', verticalPadding, className)}
    >
      {children}
    </div>
  );
}
