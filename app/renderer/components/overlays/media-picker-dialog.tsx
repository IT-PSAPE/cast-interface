import { useState } from 'react';
import type { Id, MediaAsset } from '@core/types';
import { Button } from '../controls/button';
import { DialogFrame } from './dialog-frame';
import { MediaAssetIcon } from '../display/media-asset-icon';

interface MediaPickerDialogProps {
  assets: MediaAsset[];
  onConfirm: (selected: MediaAsset[]) => void;
  onClose: () => void;
}

function MediaThumbnail({ asset }: { asset: MediaAsset }) {
  if (asset.type === 'image') {
    return <img src={asset.src} alt={asset.name} loading="lazy" draggable={false} className="block h-full w-full object-cover" />;
  }
  if (asset.type === 'video' || asset.type === 'animation') {
    return <video src={asset.src} muted playsInline preload="metadata" className="block h-full w-full object-cover" />;
  }
  return <span className="text-sm font-bold uppercase tracking-wider text-text-tertiary">{asset.type}</span>;
}

export function MediaPickerDialog({ assets, onConfirm, onClose }: MediaPickerDialogProps) {
  const [selectedIds, setSelectedIds] = useState<Set<Id>>(new Set());

  const mediaAssets = assets.filter((a) => a.type === 'image' || a.type === 'video' || a.type === 'animation');

  function toggleAsset(id: Id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleConfirm() {
    const selected = mediaAssets.filter((a) => selectedIds.has(a.id));
    if (selected.length > 0) onConfirm(selected);
  }

  const footer = (
    <>
      <span className="text-sm text-text-tertiary">
        {selectedIds.size > 0 ? `${selectedIds.size} selected` : 'Select media to add'}
      </span>
      <div className="flex gap-2">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={handleConfirm} disabled={selectedIds.size === 0}>
          Add{selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}
        </Button>
      </div>
    </>
  );

  return (
    <DialogFrame
      title="Add Media"
      onClose={onClose}
      data-ui-region="media-picker-dialog"
      popupClassName="max-w-[480px]"
      bodyClassName="overflow-hidden"
      footer={footer}
    >
      <div className="min-h-0 overflow-auto p-4">
        {mediaAssets.length === 0 ? (
          <p className="m-0 text-center text-sm text-text-tertiary">
            No media assets in the project. Import media from the drawer first.
          </p>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-3">
            {mediaAssets.map((asset) => {
              const isSelected = selectedIds.has(asset.id);
              const borderClass = isSelected ? 'border-brand ring-1 ring-brand-400' : 'border-border-primary';

              function handleClick() {
                toggleAsset(asset.id);
              }

              return (
                <button
                  key={asset.id}
                  type="button"
                  onClick={handleClick}
                  className={`group cursor-pointer rounded border bg-background-primary p-0 text-left transition-colors ${borderClass}`}
                >
                  <div className="grid aspect-square place-items-center overflow-hidden rounded-t">
                    <MediaThumbnail asset={asset} />
                  </div>
                  <p className="m-0 flex items-center gap-1.5 truncate px-1.5 py-1 text-sm text-text-secondary group-hover:text-text-primary">
                    <MediaAssetIcon asset={asset} size={12} strokeWidth={1.75} className="shrink-0 text-text-tertiary" />
                    <span className="truncate">{asset.name}</span>
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </DialogFrame>
  );
}
