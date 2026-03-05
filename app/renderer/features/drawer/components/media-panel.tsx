import { useRef, useState } from 'react';
import type { Id, MediaAsset } from '@core/types';
import { ContextMenu } from '../../../components/context-menu';
import type { ContextMenuItem } from '../../../components/context-menu';
import { useNavigation } from '../../../contexts/navigation-context';
import { useElements } from '../../../contexts/element-context';
import { usePresentationLayers } from '../../../contexts/presentation-layer-context';

interface MenuState { x: number; y: number; assetId: Id }

export function MediaPanel() {
  const { activeBundle } = useNavigation();
  const { mediaLayerAssetId, setMediaLayerAsset } = usePresentationLayers();
  const { deleteMedia, changeMediaSrc } = useElements();
  const [menuState, setMenuState] = useState<MenuState | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const changeSrcTargetRef = useRef<Id | null>(null);

  if (!activeBundle) return null;

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
        {activeBundle.mediaAssets.map((asset, index) => {
          function handleDragStart(e: React.DragEvent) { e.dataTransfer.setData('application/x-cast-media', JSON.stringify(asset)); }
          function handleAssignLayer() { setMediaLayerAsset(asset.id); }
          function handleMenuClick(e: React.MouseEvent<HTMLButtonElement>) {
            e.stopPropagation();
            openMenu(asset.id, e.currentTarget);
          }
          const selectedClass = mediaLayerAssetId === asset.id ? 'border-selected/60' : 'border-stroke';

          return (
            <button
              key={asset.id}
              onClick={handleAssignLayer}
              className="cursor-grab group bg-transparent border-0 p-0 text-left"
              draggable
              onDragStart={handleDragStart}
            >
              <div className={`relative bg-surface-0 border rounded aspect-[4/3] overflow-hidden grid place-items-center mb-1 transition-colors ${selectedClass}`}>
                <MediaThumbnail asset={asset} />
                <button
                  onClick={handleMenuClick}
                  className="absolute top-1 right-1 hidden group-hover:grid w-5 h-5 place-items-center rounded bg-surface-2/80 border border-stroke text-text-muted hover:text-text-primary hover:bg-surface-3 transition-colors text-[11px] leading-none cursor-pointer"
                  aria-label="Media options"
                >
                  ···
                </button>
              </div>
              <p className="text-[12px] text-text-secondary truncate group-hover:text-text-primary transition-colors m-0">
                <span className="text-text-muted">{index + 1}</span>{' '}
                {asset.name}
              </p>
            </button>
          );
        })}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
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
    return <img src={asset.src} alt={asset.name} loading="lazy" draggable={false} className="w-full h-full object-cover block" />;
  }
  if (asset.type === 'video') {
    return <video src={asset.src} muted playsInline preload="metadata" className="w-full h-full object-cover block" />;
  }
  return <span className="text-text-muted text-[11px] font-bold tracking-wider uppercase">{asset.type}</span>;
}
