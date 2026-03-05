import type { SlideVisualState } from '../types/ui';

const STATE_CLASSES: Record<SlideVisualState, string> = {
  live: 'text-live border-live/45 bg-live/12',
  queued: 'text-queued border-queued/45 bg-queued/12',
  selected: 'text-selected border-selected/45 bg-selected/12',
  warning: 'text-warning border-warning/45 bg-warning/12',
};

interface BadgeProps {
  state: SlideVisualState;
  marker?: string;
  label: string;
}

export function Badge({ state, marker, label }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-sm border px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide ${STATE_CLASSES[state]}`}
    >
      {marker && (
        <span className="inline-grid place-items-center w-3 h-3 rounded-sm bg-black/25 text-[9px]">
          {marker}
        </span>
      )}
      {label}
    </span>
  );
}
