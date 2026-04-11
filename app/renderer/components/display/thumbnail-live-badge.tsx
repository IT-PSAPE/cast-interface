import { CirclePlay, Play } from 'lucide-react';

interface ThumbnailLiveBadgeProps {
  className?: string;
}

export function ThumbnailLiveBadge({ className = '' }: ThumbnailLiveBadgeProps) {
  return (
    <span className={`inline-flex h-5 w-5 items-center justify-center rounded-[2px] bg-brand_solid text-white shadow-sm ${className}`.trim()}>
      <Play size={12} strokeWidth={1.9} />
    </span>
  );
}
