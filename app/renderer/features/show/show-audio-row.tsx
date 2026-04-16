import type { Id, MediaAsset } from '@core/types';
import { MediaAssetIcon } from '../../components/display/entity-icon';
import { SelectableRow } from '../../components/display/selectable-row';

interface ShowAudioRowProps {
  asset: MediaAsset;
  isActive: boolean;
  onSelect: (assetId: Id) => void;
}

export function ShowAudioRow({ asset, isActive, onSelect }: ShowAudioRowProps) {
  function handleClick() {
    onSelect(asset.id);
  }

  return (
    <SelectableRow
      selected={isActive}
      leading={<MediaAssetIcon asset={asset} size={14} strokeWidth={1.75} className="shrink-0 text-tertiary" />}
      title={asset.name}
      onClick={handleClick}
      className="h-9"
    />
  );
}
