import { useState } from 'react';
import type { Id, MediaAsset } from '@core/types';
import { cn } from '@renderer/utils/cn';
import { AlertTriangle, Ellipsis } from 'lucide-react';
import { Button } from '../../../components/controls/button';
import { MediaAssetIcon } from '../../../components/display/entity-icon';
import { SelectableRow } from '../../../components/display/selectable-row';
import { Thumbnail } from '../../../components/display/thumbnail';
import { Paragraph } from '@renderer/components/display/text';
import { FileTrigger } from '../../../components/form/file-trigger';
import { BinPanelLayout } from '../../workbench/bin-panel-layout';
import { useResourceDrawer } from '../../workbench/resource-drawer-context';
import { useMediaBin } from './use-media-bin';

interface MediaBinPanelProps {
  filterText: string;
  gridItemSize: number;
}

export function MediaBinPanel({ filterText, gridItemSize }: MediaBinPanelProps) {
  const { drawerViewMode } = useResourceDrawer();
  const { mediaAssets, mediaLayerAssetId, setMediaLayerAsset, menu, fileInputRef, buildMenuItems, handleChangeSourceSelect } = useMediaBin(filterText);

  const currentMenuItems = menu.menuState ? buildMenuItems(menu.menuState.data) : [];

  return (
    <>
      <BinPanelLayout
        gridItemSize={gridItemSize}
        mode={drawerViewMode}
        menuState={menu.menuState}
        menuItems={currentMenuItems}
        onCloseMenu={menu.close}
      >
        {mediaAssets.map((asset) => {
          const shared = {
            key: asset.id,
            asset,
            isActive: mediaLayerAssetId === asset.id,
            onAssignLayer: setMediaLayerAsset,
            onOpenMenu: menu.openFromButton,
          };
          return drawerViewMode === 'list'
            ? <MediaRow {...shared} />
            : <MediaTile {...shared} />;
        })}
      </BinPanelLayout>

      <FileTrigger.Root hidden inputRef={fileInputRef} accept="image/*,video/*" onSelect={handleChangeSourceSelect} />
    </>
  );
}

interface MediaItemProps {
  asset: MediaAsset;
  isActive: boolean;
  onAssignLayer: (id: Id) => void;
  onOpenMenu: (button: HTMLElement, data: Id) => void;
}

function MediaRow({ asset, isActive, onAssignLayer, onOpenMenu }: MediaItemProps) {
  function handleDragStart(event: React.DragEvent) {
    event.dataTransfer.setData('application/x-cast-media', JSON.stringify(asset));
  }

  function handleAssignLayer() {
    onAssignLayer(asset.id);
  }

  function handleMenuClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    onOpenMenu(e.currentTarget, asset.id);
  }

  return (
    <div draggable onDragStart={handleDragStart}>
      <SelectableRow.Root
        selected={isActive}
        onClick={handleAssignLayer}
        className="group h-9 cursor-grab"
      >
        <SelectableRow.Leading>
          <MediaAssetIcon asset={asset} size={14} strokeWidth={1.75} className="shrink-0 text-tertiary" />
        </SelectableRow.Leading>
        <SelectableRow.Label>{asset.name}</SelectableRow.Label>
        <SelectableRow.Trailing>
          <span className="text-xs uppercase tracking-wide text-tertiary">{asset.type}</span>
          <Button.Icon label="Media options" variant="ghost" onClick={handleMenuClick} className="opacity-0 group-hover:opacity-100">
            <Ellipsis size={14} />
          </Button.Icon>
        </SelectableRow.Trailing>
      </SelectableRow.Root>
    </div>
  );
}

function MediaTile({ asset, isActive, onAssignLayer, onOpenMenu }: MediaItemProps) {
  function handleDragStart(e: React.DragEvent) {
    e.dataTransfer.setData('application/x-cast-media', JSON.stringify(asset));
  }

  function handleAssignLayer() {
    onAssignLayer(asset.id);
  }

  function handleMenuClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    onOpenMenu(e.currentTarget, asset.id);
  }

  return (
    <div className="group flex cursor-grab flex-col gap-1" draggable onDragStart={handleDragStart}>
      <Thumbnail.Tile
        onClick={handleAssignLayer}
        selected={isActive}
        className={cn(isActive ? 'ring-1 ring-brand-400/35' : '')}
      >
        <Thumbnail.Body>
          <>
            <div className="pointer-events-none absolute inset-0 bg-[repeating-conic-gradient(var(--color-background-tertiary)_0%_25%,var(--color-background-quaternary)_0%_50%)] bg-[length:16px_16px]" />
            <MediaThumbnail asset={asset} />
          </>
        </Thumbnail.Body>
        <Thumbnail.Overlay position="top-right" className="hidden group-hover:block">
          <Button.Icon label="Media options" onClick={handleMenuClick} className="border-primary bg-tertiary/80">
            <Ellipsis />
          </Button.Icon>
        </Thumbnail.Overlay>
        <Thumbnail.Caption>
          <div className="flex min-w-0 items-center gap-1 text-sm text-secondary">
            <MediaAssetIcon asset={asset} size={12} strokeWidth={1.75} className="shrink-0 text-tertiary" />
            <Paragraph.xs className="truncate">{asset.name}</Paragraph.xs>
          </div>
        </Thumbnail.Caption>
      </Thumbnail.Tile>
    </div>
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
        <span className="px-2 text-center text-xs uppercase tracking-wider">Missing — use Replace Source</span>
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
