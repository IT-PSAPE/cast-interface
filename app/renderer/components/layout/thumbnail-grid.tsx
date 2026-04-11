import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@renderer/utils/cn';

interface ThumbnailGridProps extends Omit<HTMLAttributes<HTMLDivElement>, 'style' | 'children'> {
  itemSize: number;
  children: ReactNode;
  className?: string;
}

export function ThumbnailGrid({ itemSize, children, className, ...rest }: ThumbnailGridProps) {
  return (
    <div
      className={cn('grid gap-3', className)}
      style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${itemSize}px, ${itemSize + 40}px))` }}
      {...rest}
    >
      {children}
    </div>
  );
}
