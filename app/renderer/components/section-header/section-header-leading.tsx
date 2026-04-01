import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@renderer/utils/cn';
import { useSectionHeaderContext } from './section-header-context';

interface SectionHeaderLeadingProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  children: ReactNode;
}

export function SectionHeaderLeading({ children, className, ...divProps }: SectionHeaderLeadingProps) {
  const { meta } = useSectionHeaderContext();
  const verticalPadding = meta.density === 'compact' ? 'py-1' : 'py-1.5';

  return (
    <div
      {...divProps}
      className={cn('flex shrink-0 items-center pl-1.5 pr-1', verticalPadding, className)}
    >
      {children}
    </div>
  );
}
