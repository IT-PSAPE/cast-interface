import type { ReactNode } from 'react';

interface ThumbnailTileProps {
  body: ReactNode;
  caption: ReactNode;
  className?: string;
  onClick?: () => void;
  onDoubleClick?: () => void;
  selected?: boolean;
}

export function ThumbnailTile({ body, caption, className = '', onClick, onDoubleClick, selected = false }: ThumbnailTileProps) {
  const selectionClass = selected ? 'border-brand-400/60 ring-1 ring-brand-400/30' : 'border-border-primary';

  return (
    <button type="button" onClick={onClick} onDoubleClick={onDoubleClick} className={`group w-full overflow-hidden rounded-md border bg-background-primary text-left transition-colors ${selectionClass} ${className}`} >
      <div className="relative aspect-video overflow-hidden bg-background-primary">{body}</div>
      <div className="truncate border-t border-border-primary bg-background-tertiary px-2 py-1.5 text-[12px] text-text-secondary transition-colors group-hover:text-text-primary">
        {caption}
      </div>
    </button>
  );
}
