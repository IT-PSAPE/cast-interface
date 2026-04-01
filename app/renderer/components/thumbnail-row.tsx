import type { ReactNode } from 'react';
import { cn } from '@renderer/utils/cn';

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

export function ThumbnailRow({ preview, body, className = '', previewClassName = '', bodyClassName = '', overlay, onClick, onDoubleClick, selected = false }: ThumbnailRowProps) {
  const selectionClass = selected
    ? 'border-brand-400/70 ring-1 ring-brand-400/35'
    : 'border-border-primary hover:border-border-secondary';

  return (
    <button
      type="button"
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className={cn('group relative grid w-full grid-cols-[200px_1fr] overflow-hidden rounded-md border bg-background-primary text-left transition-colors', selectionClass, className)}
    >
      <div className={cn('relative overflow-hidden border-r border-border-primary bg-background-tertiary', previewClassName)}>
        {preview}
      </div>
      <div className={cn('grid min-h-[84px] content-center gap-1 px-2.5 py-2', bodyClassName)}>
        {body}
      </div>
      {overlay}
    </button>
  );
}
