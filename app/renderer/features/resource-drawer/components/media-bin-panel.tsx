import { useRef, useState } from 'react';
import type { Id, MediaAsset } from '@core/types';
import { Icon } from '../../../components/icon';
import { ContextMenu } from '../../../components/context-menu';
import type { ContextMenuItem } from '../../../components/context-menu';
import { IconButton } from '../../../components/icon-button';
import { MediaAssetIcon } from '../../../components/media-asset-icon';
import { ThumbnailTile } from '../../../components/thumbnail-tile';
import { useElements } from '../../../contexts/element-context';
import { usePresentationLayers } from '../../../contexts/presentation-layer-context';
import { useProjectContent } from '../../../contexts/use-project-content';

interface MenuState { x: number; y: number; assetId: Id }

interface MediaBinPanelProps {
  filterText: string;
}

export function MediaBinPanel({ filterText }: MediaBinPanelProps) {
  const { mediaAssets: allMediaAssets } = useProjectContent();
  const { mediaLayerAssetId, setMediaLayerAsset } = usePresentationLayers();
  const { deleteMedia, changeMediaSrc } = useElements();
  const [menuState, setMenuState] = useState<MenuState | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const changeSrcTargetRef = useRef<Id | null>(null);

  const normalizedFilter = filterText.trim().toLowerCase();
  const mediaAssets = allMediaAssets.filter((asset) => {
    if (!normalizedFilter) return true;
    return asset.name.toLowerCase().includes(normalizedFilter) || asset.type.toLowerCase().includes(normalizedFilter);
  });

  function openMenu(assetId: Id, button: HTMLButtonElement) {
    const rect = button.getBoundingClientRect();
    setMenuState({ x: rect.left, y: rect.bottom + 4, assetId });
  }

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

  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3">
        {mediaAssets.map((asset) => {
          function handleDragStart(e: React.DragEvent) { e.dataTransfer.setData('application/x-cast-media', JSON.stringify(asset)); }
          function handleAssignLayer() { setMediaLayerAsset(asset.id); }
          function handleMenuClick(e: React.MouseEvent<HTMLButtonElement>) {
            e.stopPropagation();
            openMenu(asset.id, e.currentTarget);
          }

          return (
            <div
              key={asset.id}
              className="group cursor-grab"
              draggable
              onDragStart={handleDragStart}
            >
              <ThumbnailTile
                onClick={handleAssignLayer}
                selected={mediaLayerAssetId === asset.id}
                body={
                  <>
                    <div className="pointer-events-none absolute inset-0 bg-[repeating-conic-gradient(var(--color-background-tertiary)_0%_25%,var(--color-background-quaternary)_0%_50%)] bg-[length:16px_16px]" />
                    <MediaThumbnail asset={asset} />
                    <div className="absolute right-1 top-1 hidden group-hover:block">
                      <IconButton label="Media options" onClick={handleMenuClick} size="sm" className="border-border-primary bg-background-tertiary/80">
                        <Icon.dots_horizontal size={14} strokeWidth={2} />
                      </IconButton>
                    </div>
                  </>
                }
                caption={(
                  <span className="inline-flex min-w-0 items-center gap-1.5">
                      <MediaAssetIcon asset={asset} size={12} strokeWidth={1.75} className="text-text-tertiary" />
                      <span className="truncate">{asset.name}</span>
                  </span>
                )}
              />
            </div>
          );
        })}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*,audio/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {menuState ? (
        <ContextMenu
          x={menuState.x}
          y={menuState.y}
          items={buildMenuItems(menuState.assetId)}
          onClose={() => setMenuState(null)}
        />
      ) : null}
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
  return <span className="text-text-tertiary text-sm font-bold tracking-wider uppercase">{asset.type}</span>;
}
