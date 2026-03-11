import type { Presentation, PresentationEntityType } from '@core/types';
import { Icon } from './icon';

interface PresentationEntityIconProps {
  entity: Pick<Presentation, 'entityType'> | PresentationEntityType;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function PresentationEntityIcon({ entity, size = 14, strokeWidth = 1.75, className = '' }: PresentationEntityIconProps) {
  const entityType = typeof entity === 'string' ? entity : entity.entityType;

  if (entityType === 'lyric') {
    return <Icon.music_note_01 size={size} strokeWidth={strokeWidth} className={className} />;
  }

  return <Icon.presentation_chart_03 size={size} strokeWidth={strokeWidth} className={className} />;
}
