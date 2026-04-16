import type { Id, MediaAsset } from '@core/types';
import { cn } from '@renderer/utils/cn';
import { Ellipsis } from 'lucide-react';
import { Button } from '../../../components/controls/button';
import { MediaAssetIcon } from '../../../components/display/entity-icon';
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
        {mediaAssets.map((asset) => (
          <MediaCard
            key={asset.id}
            asset={asset}
            isActive={mediaLayerAssetId === asset.id}
            mode={drawerViewMode}
            onAssignLayer={setMediaLayerAsset}
            onOpenMenu={menu.openFromButton}
          />
        ))}
      </BinPanelLayout>

      <FileTrigger.Root hidden inputRef={fileInputRef} accept="image/*,video/*" onSelect={handleChangeSourceSelect} />
    </>
  );
}

interface MediaCardProps {
  asset: MediaAsset;
  isActive: boolean;
  mode: 'grid' | 'list';
  onAssignLayer: (id: Id) => void;
  onOpenMenu: (button: HTMLElement, data: Id) => void;
}

function MediaCard({ asset, isActive, mode, onAssignLayer, onOpenMenu }: MediaCardProps) {
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

  if (mode === 'list') {
    return (
      <div className="group cursor-grab" draggable onDragStart={handleDragStart}>
        <Thumbnail.Row
          onClick={handleAssignLayer}
          selected={isActive}
        >
          <Thumbnail.Preview className="aspect-video">
            {renderMediaPreview(asset)}
          </Thumbnail.Preview>
          <Thumbnail.Body>
            <>
              <div className="flex min-w-0 items-center gap-1 text-sm text-secondary">
                <MediaAssetIcon asset={asset} size={12} strokeWidth={1.75} className="shrink-0 text-tertiary" />
                <Paragraph.xs className="truncate">{asset.name}</Paragraph.xs>
              </div>
              <Paragraph.xs className="uppercase tracking-wide text-tertiary">{asset.type}</Paragraph.xs>
            </>
          </Thumbnail.Body>
          <Thumbnail.Overlay position="top-right" className="right-2 top-2 hidden group-hover:block">
            <div>
              <Button.Icon label="Media options" onClick={handleMenuClick} className="border-primary bg-tertiary/80">
                <Ellipsis />
              </Button.Icon>
            </div>
          </Thumbnail.Overlay>
        </Thumbnail.Row>
      </div>
    );
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

function renderMediaPreview(asset: MediaAsset) {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 bg-[repeating-conic-gradient(var(--color-background-tertiary)_0%_25%,var(--color-background-quaternary)_0%_50%)] bg-[length:16px_16px]" />
      <MediaThumbnail asset={asset} />
    </>
  );
}

function MediaThumbnail({ asset }: { asset: MediaAsset }) {
  if (asset.type === 'image') {
    return <img src={asset.src} alt={asset.name} loading="lazy" draggable={false} className="absolute inset-0 h-full w-full object-cover" />;
  }
  if (asset.type === 'video') {
    return <video src={asset.src} muted playsInline preload="metadata" className="absolute inset-0 h-full w-full object-cover" />;
  }
  return <span className="text-tertiary text-sm font-bold tracking-wider uppercase">{asset.type}</span>;
}
