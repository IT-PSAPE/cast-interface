import type { ReactNode } from 'react';

interface EmptyStatePanelProps {
  glyph: ReactNode;
  title: string;
  description: string;
}

export function EmptyStatePanel({ glyph, title, description }: EmptyStatePanelProps) {
  return (
    <section className="flex h-full min-h-0 items-center justify-center p-6">
      <div className="flex flex-col max-w-md items-center gap-3 rounded-lg border border-primary bg-primary/50 px-8 py-10 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-primary bg-tertiary text-tertiary">
          {glyph}
        </div>
        <h2 className="m-0 text-lg font-semibold text-primary">{title}</h2>
        <p className="m-0 text-sm text-tertiary">{description}</p>
      </div>
    </section>
  );
}
