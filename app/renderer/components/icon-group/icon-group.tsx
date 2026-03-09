import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@renderer/utils/cn';
import { cv } from '@renderer/utils/cv';

const iconGroupRootStyles = cv({
  base: 'flex items-stretch gap-px rounded-md *:first:rounded-l-md *:last:rounded-r-md',
  variants: {
    fill: {
      true: ['w-full'],
      false: ['w-fit'],
    },
  },
  defaultVariants: {
    fill: 'false',
  },
});

interface IconGroupRootProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  children: ReactNode;
  fill?: boolean;
}

export function IconGroupRoot({ children, className, fill = false, ...divProps }: IconGroupRootProps) {
  return (
    <div
      {...divProps}
      className={cn(iconGroupRootStyles({ fill: fill ? 'true' : 'false' }), className)}
    >
      {children}
    </div>
  );
}
