interface SlideBrowserPresentationStripProps {
  title: string;
  meta: string;
}

export function SlideBrowserPresentationStrip({ title, meta }: SlideBrowserPresentationStripProps) {
  return (
    <header className="flex h-8 items-center gap-3 border-b border-stroke bg-surface-1/70 px-3">
      <span className="truncate text-[12px] font-medium text-text-primary" title={title}>
        {title}
      </span>
      <span className="ml-auto shrink-0 text-[11px] text-text-muted tabular-nums">
        {meta}
      </span>
    </header>
  );
}
