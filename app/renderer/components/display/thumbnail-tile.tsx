import type { ReactNode } from 'react';
import { cn } from '@renderer/utils/cn';

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

export function ThumbnailTile({ body, caption, className = '', bodyClassName = '', captionClassName = '', overlay, onClick, onDoubleClick, selected = false }: ThumbnailTileProps) {
  const selectionClass = selected
    ? 'border-brand-400/70 ring-1 ring-brand-400/35'
    : 'border-border-primary hover:border-border-secondary';

  return (
    <button
      type="button"
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className={cn('group relative w-full overflow-hidden rounded-md border bg-background-primary text-left transition-colors', selectionClass, className)}
    >
      <div className={cn('relative aspect-video overflow-hidden bg-background-primary', bodyClassName)}>{body}</div>
      {overlay}
      <div className={cn('truncate border-t border-border-primary bg-background-tertiary px-2 py-1 text-sm text-text-secondary transition-colors group-hover:text-text-primary', captionClassName)}>
        {caption}
      </div>
    </button>
  );
}
