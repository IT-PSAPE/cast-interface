import type { ContentItem, ContentItemType } from '@core/types';
import { Icon } from './icon';

interface ContentItemIconProps {
  entity: Pick<ContentItem, 'type'> | ContentItemType;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function ContentItemIcon({ entity, size = 14, strokeWidth = 1.75, className = '' }: ContentItemIconProps) {
  const entityType = typeof entity === 'string' ? entity : entity.type;

  if (entityType === 'lyric') {
    return <Icon.music_note_01 size={size} strokeWidth={strokeWidth} className={className} />;
  }

  return <Icon.presentation_chart_03 size={size} strokeWidth={strokeWidth} className={className} />;
}
