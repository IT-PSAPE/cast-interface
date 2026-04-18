import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@renderer/utils/cn';

function Root({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex flex-1 flex-col items-center justify-center gap-2 p-4 text-center', className)} {...props}>
      {children}
    </div>
  );
}

function Icon({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('text-quaternary', className)} {...props}>
      {children}
    </div>
  );
}

function Title({ children, className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('max-w-[16rem] text-xs font-medium text-secondary', className)} {...props}>
      {children}
    </p>
  );
}

function Description({ children, className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('max-w-[16rem] text-xs text-tertiary', className)} {...props}>
      {children}
    </p>
  );
}

function Action({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('mt-1 flex items-center gap-2', className)} {...props}>
      {children}
    </div>
  );
}

export const EmptyState = { Root, Icon, Title, Description, Action };
