import type { MediaAsset, MediaAssetType } from '@core/types';
import { Icon } from './icon';

interface MediaAssetIconProps {
  asset: Pick<MediaAsset, 'type'> | MediaAssetType;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function MediaAssetIcon({ asset, size = 14, strokeWidth = 1.75, className = '' }: MediaAssetIconProps) {
  const type = typeof asset === 'string' ? asset : asset.type;

  if (type === 'image') {
    return <Icon.image_03 size={size} strokeWidth={strokeWidth} className={className} />;
  }

  if (type === 'audio') {
    return <Icon.microphone_01 size={size} strokeWidth={strokeWidth} className={className} />;
  }

  return <Icon.film_01 size={size} strokeWidth={strokeWidth} className={className} />;
}
