import { useState } from 'react';
import type { Id, MediaAsset } from '@core/types';
import { cn } from '@renderer/utils/cn';
import { AlertTriangle } from 'lucide-react';
import { MediaAssetIcon } from '../../../components/display/entity-icon';
import { SelectableRow } from '../../../components/display/selectable-row';
import { Thumbnail } from '../../../components/display/thumbnail';
import { Paragraph } from '@renderer/components/display/text';
import { BinPanelLayout } from '@renderer/components/layout/collection-layout';
import { useResourceDrawer } from '../../workbench/resource-drawer-context';
import { useMediaBin } from './use-media-bin';

interface MediaBinPanelProps {
  filterText: string;
  gridItemSize: number;
}

export function MediaBinPanel({ filterText, gridItemSize }: MediaBinPanelProps) {
  const { drawerViewMode } = useResourceDrawer();
  const { mediaAssets, mediaLayerAssetId, handleApply } = useMediaBin(filterText);

  return (
    <BinPanelLayout gridItemSize={gridItemSize} mode={drawerViewMode}>
      {mediaAssets.map((asset) => (
        <MediaBinItem key={asset.id} asset={asset} isActive={mediaLayerAssetId === asset.id} mode={drawerViewMode} onAssignLayer={handleApply} />
      ))}
    </BinPanelLayout>
  );
}

interface MediaItemProps {
  asset: MediaAsset;
  isActive: boolean;
  onAssignLayer: (id: Id) => void;
}

function MediaBinItem({ mode, ...props }: MediaItemProps & { mode: NonNullable<ReturnType<typeof useResourceDrawer>['drawerViewMode']> }) {
  if (mode === 'list') return <MediaRow {...props} />;
  return <MediaTile {...props} />;
}

function MediaRow({ asset, isActive, onAssignLayer }: MediaItemProps) {
  function handleAssignLayer() {
    onAssignLayer(asset.id);
  }

  return (
    <SelectableRow.Root
      selected={isActive}
      onClick={handleAssignLayer}
      className="h-9"
    >
      <SelectableRow.Leading>
        <MediaAssetIcon asset={asset} size={14} strokeWidth={1.75} className="shrink-0 text-tertiary" />
      </SelectableRow.Leading>
      <SelectableRow.Label>{asset.name}</SelectableRow.Label>
      <SelectableRow.Trailing>
        <span className="text-xs uppercase tracking-wide text-tertiary">{asset.type}</span>
      </SelectableRow.Trailing>
    </SelectableRow.Root>
  );
}

function MediaTile({ asset, isActive, onAssignLayer }: MediaItemProps) {
  function handleAssignLayer() {
    onAssignLayer(asset.id);
  }

  return (
    <Thumbnail.Tile
      onClick={handleAssignLayer}
      selected={isActive}
      className={cn(isActive ? 'ring-1 ring-brand-400/35' : '')}
    >
      <Thumbnail.Body>
        <div className="pointer-events-none absolute inset-0 bg-[repeating-conic-gradient(var(--color-background-tertiary)_0%_25%,var(--color-background-quaternary)_0%_50%)] bg-[length:16px_16px]" />
        <MediaThumbnail asset={asset} />
      </Thumbnail.Body>
      <Thumbnail.Caption>
        <div className="flex min-w-0 items-center gap-1 text-sm text-secondary">
          <MediaAssetIcon asset={asset} size={12} strokeWidth={1.75} className="shrink-0 text-tertiary" />
          <Paragraph.xs className="truncate">{asset.name}</Paragraph.xs>
        </div>
      </Thumbnail.Caption>
    </Thumbnail.Tile>
  );
}

function MediaThumbnail({ asset }: { asset: MediaAsset }) {
  const [brokenSrc, setBrokenSrc] = useState<string | null>(null);
  const isBroken = brokenSrc === asset.src;

  // Reset the broken flag when the source changes (e.g. after Replace Source).
  if (brokenSrc !== null && brokenSrc !== asset.src) {
    setBrokenSrc(null);
  }

  if (isBroken) {
    return (
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-1 bg-tertiary/80 text-tertiary">
        <AlertTriangle size={16} strokeWidth={1.75} />
        <span className="px-2 text-center text-xs uppercase tracking-wider">Missing source</span>
      </div>
    );
  }

  if (asset.type === 'image') {
    return (
      <img
        src={asset.src}
        alt={asset.name}
        loading="lazy"
        draggable={false}
        onError={() => setBrokenSrc(asset.src)}
        className="absolute inset-0 h-full w-full object-cover"
      />
    );
  }
  if (asset.type === 'video') {
    return (
      <video
        src={asset.src}
        muted
        playsInline
        preload="metadata"
        onError={() => setBrokenSrc(asset.src)}
        className="absolute inset-0 h-full w-full object-cover"
      />
    );
  }
  return <span className="text-tertiary text-sm font-bold tracking-wider uppercase">{asset.type}</span>;
}
