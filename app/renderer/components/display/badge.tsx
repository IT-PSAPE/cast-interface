import { cn } from '@renderer/utils/cn';
import { cv } from '@renderer/utils/cv';

export type BadgeVariant = 'success' | 'info' | 'primary' | 'warning';

const badgeVariants = cv({
  base: [
    'inline-flex items-center gap-0.5 rounded-sm border px-1.5 py-px text-sm font-semibold uppercase tracking-wide',
  ],
  variants: {
    variant: {
      success: ['text-green-500 border-green-500/45 bg-green-500/12'],
      info: ['text-blue-400 border-blue-400/45 bg-blue-400/12'],
      primary: ['text-brand-400 border-brand-400/45 bg-brand-400/12'],
      warning: ['text-yellow-400 border-yellow-400/45 bg-yellow-400/12'],
    },
  },
});

interface BadgeProps {
  variant: BadgeVariant;
  marker?: string;
  label: string;
  className?: string;
}

export function Badge({ variant, marker, label, className }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)}>
      {marker ? (
        <span className="inline-grid place-items-center w-3 h-3 rounded-sm bg-black/25 text-sm">
          {marker}
        </span>
      ) : null}
      {label}
    </span>
  );
}
