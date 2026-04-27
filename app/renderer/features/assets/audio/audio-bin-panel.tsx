import type { Id, MediaAsset } from '@core/types';
import { MediaAssetIcon } from '../../../components/display/entity-icon';
import { EmptyState } from '../../../components/display/empty-state';
import { SelectableRow } from '../../../components/display/selectable-row';
import { useAudioCoverArt } from '../../../hooks/use-audio-cover-art';
import { BinPanelLayout } from '../../workbench/bin-panel-layout';
import { useAudioBin } from './use-audio-bin';

interface AudioBinPanelProps {
  filterText: string;
  gridItemSize: number;
}

export function AudioBinPanel({ filterText, gridItemSize }: AudioBinPanelProps) {
  const { audioAssets, currentAudioAssetId, selectAudio } = useAudioBin(filterText);

  if (audioAssets.length === 0) {
    return (
      <EmptyState.Root>
        <EmptyState.Title>No audio files</EmptyState.Title>
        <EmptyState.Description>Import audio to build a reusable app-wide audio list.</EmptyState.Description>
      </EmptyState.Root>
    );
  }

  return (
    <BinPanelLayout gridItemSize={gridItemSize} mode="list">
      {audioAssets.map((asset) => (
        <AudioRow
          key={asset.id}
          asset={asset}
          isSelected={currentAudioAssetId === asset.id}
          onSelect={selectAudio}
        />
      ))}
    </BinPanelLayout>
  );
}

interface AudioRowProps {
  asset: MediaAsset;
  isSelected: boolean;
  onSelect: (id: Id) => void;
}

function AudioRow({ asset, isSelected, onSelect }: AudioRowProps) {
  const coverArt = useAudioCoverArt(asset.src);

  function handleSelect() {
    onSelect(asset.id);
  }

  return (
    <SelectableRow.Root selected={isSelected} onClick={handleSelect} className="h-9">
      <SelectableRow.Leading>
        {coverArt ? (
          <img src={coverArt} alt="" className="h-6 w-6 rounded object-cover" />
        ) : (
          <MediaAssetIcon asset={asset} size={14} strokeWidth={1.75} className="shrink-0 text-tertiary" />
        )}
      </SelectableRow.Leading>
      <SelectableRow.Label>{asset.name}</SelectableRow.Label>
    </SelectableRow.Root>
  );
}
