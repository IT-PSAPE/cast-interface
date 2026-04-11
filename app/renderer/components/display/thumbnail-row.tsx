import type { ReactNode } from 'react';
import { cn } from '@renderer/utils/cn';
import { cv } from '@renderer/utils/cv';

const rowStyles = cv({
  base: 'group relative grid w-full grid-cols-[200px_1fr] overflow-hidden rounded-md border bg-primary text-left transition-colors',
  variants: {
    selected: {
      true: ['border-brand-400/70 ring-1 ring-brand-400/35'],
      false: ['border-primary hover:border-secondary'],
    },
  },
  defaultVariants: {
    selected: false,
  },
});

interface ThumbnailRowProps {
  preview: ReactNode;
  body: ReactNode;
  className?: string;
  previewClassName?: string;
  bodyClassName?: string;
  overlay?: ReactNode;
  onClick?: () => void;
  onDoubleClick?: () => void;
  selected?: boolean;
}

export function ThumbnailRow({ preview, body, className, previewClassName, bodyClassName, overlay, onClick, onDoubleClick, selected = false }: ThumbnailRowProps) {
  return (
    <button type="button" onClick={onClick} onDoubleClick={onDoubleClick} className={cn(rowStyles({ selected }), className)}>
      <div className={cn('relative overflow-hidden border-r border-primary bg-tertiary', previewClassName)}>
        {preview}
      </div>
      <div className={cn('grid min-h-[84px] content-center gap-1 px-2.5 py-2', bodyClassName)}>
        {body}
      </div>
      {overlay}
    </button>
  );
}
