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
  const selectionClass = selected ? 'border-selected/60 ring-1 ring-selected/30' : 'border-stroke';

  return (
    <button
      type="button"
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className={`group overflow-hidden rounded-md border bg-surface-0 text-left transition-colors ${selectionClass} ${className}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-0">{body}</div>
      <div className="border-t border-stroke bg-surface-2 px-2 py-1.5 text-[12px] text-text-secondary transition-colors group-hover:text-text-primary">
        {caption}
      </div>
    </button>
  );
}
