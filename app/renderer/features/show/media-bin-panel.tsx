import { useRef } from 'react';
import type { Id, MediaAsset } from '@core/types';
import { cn } from '@renderer/utils/cn';
import { Ellipsis } from 'lucide-react';
import { ContextMenu } from '../../components/overlays/context-menu';
import type { ContextMenuItem } from '../../components/overlays/context-menu';
import { Button } from '../../components/controls/button';
import { MediaAssetIcon } from '../../components/display/media-asset-icon';
import { FileTrigger } from '../../components/form/file-trigger';
import { ThumbnailGrid } from '../../components/layout/thumbnail-grid';
import { useElements } from '../../contexts/element/element-context';
import { usePresentationLayers } from '../../contexts/presentation-layer-context';
import { useProjectContent } from '../../contexts/use-project-content';
import { useContextMenuState } from '../../hooks/use-context-menu-state';
import { filterByText } from '../../utils/filter-by-text';

interface MediaBinPanelProps {
  filterText: string;
  gridItemSize: number;
}

export function MediaBinPanel({ filterText, gridItemSize }: MediaBinPanelProps) {
  const { mediaAssets: allMediaAssets } = useProjectContent();
  const { mediaLayerAssetId, setMediaLayerAsset } = usePresentationLayers();
  const { deleteMedia, changeMediaSrc } = useElements();
  const menu = useContextMenuState<Id>();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const changeSrcTargetRef = useRef<Id | null>(null);

  const mediaAssets = filterByText(
    allMediaAssets.filter((asset) => asset.type !== 'audio'),
    filterText,
    (asset) => [asset.name, asset.type],
  );

  function handleApply(assetId: Id) {
    setMediaLayerAsset(assetId);
  }

  function handleChangeSrc(assetId: Id) {
    changeSrcTargetRef.current = assetId;
    fileInputRef.current?.click();
  }

  function handleDelete(assetId: Id) {
    void deleteMedia(assetId);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const targetId = changeSrcTargetRef.current;
    if (file && targetId) void changeMediaSrc(targetId, file);
    changeSrcTargetRef.current = null;
    e.target.value = '';
  }

  function buildMenuItems(assetId: Id): ContextMenuItem[] {
    return [
      { id: 'apply', label: 'Apply to Layer', onSelect: () => handleApply(assetId) },
      { id: 'change-src', label: 'Change Source', onSelect: () => handleChangeSrc(assetId) },
      { id: 'delete', label: 'Delete', danger: true, onSelect: () => handleDelete(assetId) },
    ];
  }

  function handleChangeSourceSelect(_files: FileList, event: React.ChangeEvent<HTMLInputElement>) {
    handleFileChange(event);
  }

  return (
    <>
      <ThumbnailGrid itemSize={gridItemSize}>
        {mediaAssets.map((asset) => (
          <MediaCard
            key={asset.id}
            asset={asset}
            isActive={mediaLayerAssetId === asset.id}
            onAssignLayer={setMediaLayerAsset}
            onOpenMenu={menu.openFromButton}
          />
        ))}
      </ThumbnailGrid>

      <FileTrigger.Root hidden inputRef={fileInputRef} accept="image/*,video/*" onSelect={handleChangeSourceSelect} />

      {menu.menuState ? (
        <ContextMenu
          x={menu.menuState.x}
          y={menu.menuState.y}
          items={buildMenuItems(menu.menuState.data)}
          onClose={menu.close}
        />
      ) : null}
    </>
  );
}

interface MediaCardProps {
  asset: MediaAsset;
  isActive: boolean;
  onAssignLayer: (id: Id) => void;
  onOpenMenu: (button: HTMLElement, data: Id) => void;
}

function MediaCard({ asset, isActive, onAssignLayer, onOpenMenu }: MediaCardProps) {
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
    <div className="group grid gap-1.5 cursor-grab" draggable onDragStart={handleDragStart}>
      <button
        type="button"
        onClick={handleAssignLayer}
        className={cn(
          'relative aspect-video overflow-hidden rounded-md border bg-primary text-left transition-colors',
          isActive ? 'border-brand-400/70 ring-1 ring-brand-400/35' : 'border-primary hover:border-secondary',
        )}
      >
        <div className="pointer-events-none absolute inset-0 bg-[repeating-conic-gradient(var(--color-background-tertiary)_0%_25%,var(--color-background-quaternary)_0%_50%)] bg-[length:16px_16px]" />
        <MediaThumbnail asset={asset} />
        <div className="absolute right-1 top-1 hidden group-hover:block">
          <Button.Icon label="Media options" onClick={handleMenuClick} size="sm" className="border-primary bg-tertiary/80">
            <Ellipsis size={14} strokeWidth={2} />
          </Button.Icon>
        </div>
      </button>
      <div className="flex min-w-0 items-center gap-1.5 px-0.5 text-sm text-secondary">
        <MediaAssetIcon asset={asset} size={12} strokeWidth={1.75} className="shrink-0 text-tertiary" />
        <span className="truncate">{asset.name}</span>
      </div>
    </div>
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
