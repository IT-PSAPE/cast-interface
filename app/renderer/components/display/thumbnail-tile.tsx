import type { ReactNode } from 'react';
import { cn } from '@renderer/utils/cn';
import { cv } from '@renderer/utils/cv';

const tileStyles = cv({
  base: 'group relative w-full overflow-hidden rounded-md border bg-primary text-left transition-colors',
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

interface ThumbnailTileProps {
  body: ReactNode;
  caption: ReactNode;
  className?: string;
  bodyClassName?: string;
  captionClassName?: string;
  overlay?: ReactNode;
  onClick?: () => void;
  onDoubleClick?: () => void;
  selected?: boolean;
}

export function ThumbnailTile({ body, caption, className, bodyClassName, captionClassName, overlay, onClick, onDoubleClick, selected = false }: ThumbnailTileProps) {
  return (
    <button type="button" onClick={onClick} onDoubleClick={onDoubleClick} className={cn(tileStyles({ selected }), className)}>
      <div className={cn('relative aspect-video overflow-hidden bg-primary', bodyClassName)}>{body}</div>
      {overlay}
      <div className={cn('truncate border-t border-primary bg-tertiary px-2 py-1 text-sm text-secondary transition-colors group-hover:text-primary', captionClassName)}>
        {caption}
      </div>
    </button>
  );
}
