import type { ReactNode } from 'react';

interface EmptyStatePanelProps {
  glyph: ReactNode;
  title: string;
  description: string;
}

export function EmptyStatePanel({ glyph, title, description }: EmptyStatePanelProps) {
  return (
    <section className="grid h-full min-h-0 place-items-center p-6">
      <div className="grid max-w-md place-items-center gap-3 rounded-lg border border-border-primary bg-primary/50 px-8 py-10 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-xl border border-border-primary bg-background-tertiary text-text-tertiary">
          {glyph}
        </div>
        <h2 className="m-0 text-[15px] font-semibold text-text-primary">{title}</h2>
        <p className="m-0 text-[12px] text-text-tertiary">{description}</p>
      </div>
    </section>
  );
}
