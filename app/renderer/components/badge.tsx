import type { SlideVisualState } from '../types/ui';

const STATE_CLASSES: Record<SlideVisualState, string> = {
  live: 'text-green-500 border-green-500/45 bg-green-500/12',
  queued: 'text-blue-400 border-blue-400/45 bg-blue-400/12',
  selected: 'text-brand-400 border-brand-400/45 bg-brand-400/12',
  warning: 'text-yellow-400 border-yellow-400/45 bg-yellow-400/12',
};

interface BadgeProps {
  state: SlideVisualState;
  marker?: string;
  label: string;
}

export function Badge({ state, marker, label }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-sm border px-1.5 py-px text-sm font-semibold uppercase tracking-wide ${STATE_CLASSES[state]}`}
    >
      {marker && (
        <span className="inline-grid place-items-center w-3 h-3 rounded-sm bg-black/25 text-sm">
          {marker}
        </span>
      )}
      {label}
    </span>
  );
}
