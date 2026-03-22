import type { Id, MediaAsset } from '@core/types';
import { Icon } from '../../../components/icon';
import { MediaAssetIcon } from '../../../components/media-asset-icon';
import { SelectableRow } from '../../../components/selectable-row';

interface ShowAudioRowProps {
  asset: MediaAsset;
  isActive: boolean;
  isPlaying: boolean;
  onSelect: (assetId: Id) => void;
}

export function ShowAudioRow({ asset, isActive, isPlaying, onSelect }: ShowAudioRowProps) {
  function handleClick() {
    onSelect(asset.id);
  }

  const trailing = isActive
    ? isPlaying ? <Icon.pause_circle size={14} strokeWidth={1.75} /> : <Icon.play_circle size={14} strokeWidth={1.75} />
    : null;

  return (
    <SelectableRow
      selected={isActive}
      leading={<MediaAssetIcon asset={asset} size={14} strokeWidth={1.75} className="shrink-0 text-text-tertiary" />}
      title={asset.name}
      trailing={trailing}
      onClick={handleClick}
      className="h-9"
    />
  );
}
