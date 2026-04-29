import type { Id, MediaAsset } from '@core/types';
import { MediaAssetIcon } from '../../../components/display/entity-icon';
import { EmptyState } from '../../../components/display/empty-state';
import { SelectableRow } from '../../../components/display/selectable-row';
import { useAudioCoverArt } from '../../../hooks/use-audio-cover-art';
import { BinPanelLayout } from '@renderer/components/layout/collection-layout';
import { useAudioBin } from './use-audio-bin';

interface AudioBinPanelProps {
  filterText: string;
  gridItemSize: number;
}

export function AudioBinPanel({ filterText, gridItemSize }: AudioBinPanelProps) {
  const { audioAssets, currentAudioAssetId, armAudio } = useAudioBin(filterText);

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
          isActive={currentAudioAssetId === asset.id}
          onArm={armAudio}
        />
      ))}
    </BinPanelLayout>
  );
}

interface AudioRowProps {
  asset: MediaAsset;
  isActive: boolean;
  onArm: (id: Id) => void;
}

function AudioRow({ asset, isActive, onArm }: AudioRowProps) {
  const coverArt = useAudioCoverArt(asset.src);

  function handleArm() {
    onArm(asset.id);
  }

  return (
    <SelectableRow.Root selected={isActive} onClick={handleArm} className="h-9">
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
