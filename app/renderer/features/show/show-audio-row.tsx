import type { Id, MediaAsset } from '@core/types';
import { CirclePause, CirclePlay } from 'lucide-react';
import { MediaAssetIcon } from '../../components/display/entity-icon';
import { SelectableRow } from '../../components/display/selectable-row';

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
    ? isPlaying ? <CirclePause size={14} strokeWidth={1.75} /> : <CirclePlay size={14} strokeWidth={1.75} />
    : null;

  return (
    <SelectableRow
      selected={isActive}
      leading={<MediaAssetIcon asset={asset} size={14} strokeWidth={1.75} className="shrink-0 text-tertiary" />}
      title={asset.name}
      trailing={trailing}
      onClick={handleClick}
      className="h-9"
    />
  );
}
