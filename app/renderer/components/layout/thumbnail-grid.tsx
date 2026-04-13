import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@renderer/utils/cn';

interface ThumbnailGridProps extends Omit<HTMLAttributes<HTMLDivElement>, 'style' | 'children'> {
  columns: number;
  children: ReactNode;
  className?: string;
}

export function ThumbnailGrid({ columns, children, className, ...rest }: ThumbnailGridProps) {
  return (
    <div className={cn('grid gap-1.5', className)} style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }} {...rest} >
      {children}
    </div>
  );
}
