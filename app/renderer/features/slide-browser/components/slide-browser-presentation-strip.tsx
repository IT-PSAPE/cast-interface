import type { ReactNode } from 'react';

interface SlideBrowserPresentationStripProps {
  title: string;
  meta: string;
  action?: ReactNode;
}

export function SlideBrowserPresentationStrip({ title, meta, action = null }: SlideBrowserPresentationStripProps) {
  return (
    <header className="flex h-8 items-center gap-3 border-b border-border-primary bg-primary/70 px-3">
      <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-text-primary" title={title}>
        {title}
      </span>
      <span className="shrink-0 text-[11px] text-text-tertiary tabular-nums">
        {meta}
      </span>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
