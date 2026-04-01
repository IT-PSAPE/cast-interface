import { Icon } from './icon';

interface ThumbnailLiveBadgeProps {
  className?: string;
}

export function ThumbnailLiveBadge({ className = '' }: ThumbnailLiveBadgeProps) {
  return (
    <span className={`inline-flex h-5 w-5 items-center justify-center rounded-md border border-green-500/45 bg-green-500/90 text-white shadow-sm ${className}`.trim()}>
      <Icon.play_circle size={11} strokeWidth={1.9} />
    </span>
  );
}
