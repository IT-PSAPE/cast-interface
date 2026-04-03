import type { ContentItem, ContentItemType } from '@core/types';
import { Music, Presentation } from 'lucide-react';

interface ContentItemIconProps {
  entity: Pick<ContentItem, 'type'> | ContentItemType;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function ContentItemIcon({ entity, size = 14, strokeWidth = 1.75, className = '' }: ContentItemIconProps) {
  const entityType = typeof entity === 'string' ? entity : entity.type;

  if (entityType === 'lyric') {
    return <Music size={size} strokeWidth={strokeWidth} className={className} />;
  }

  return <Presentation size={size} strokeWidth={strokeWidth} className={className} />;
}
