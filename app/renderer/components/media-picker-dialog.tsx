import { useCallback, useEffect, useRef, useState } from 'react';
import type { Id, MediaAsset } from '@core/types';
import { Button } from './button';

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
  return <span className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary">{asset.type}</span>;
}

export function MediaPickerDialog({ assets, onConfirm, onClose }: MediaPickerDialogProps) {
  const [selectedIds, setSelectedIds] = useState<Set<Id>>(new Set());
  const backdropRef = useRef<HTMLDivElement>(null);

  const mediaAssets = assets.filter((a) => a.type === 'image' || a.type === 'video' || a.type === 'animation');

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === backdropRef.current) onClose();
  }

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

  return (
    <div
      ref={backdropRef}
      data-ui-region="media-picker-dialog"
      className="pointer-events-auto absolute inset-0 z-50 grid place-items-center bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="grid w-[480px] max-h-[420px] grid-rows-[auto_1fr_auto] rounded-lg border border-border-primary bg-background-primary_alt shadow-2xl">
        <header className="flex items-center justify-between border-b border-border-primary px-4 py-3">
          <h2 className="m-0 text-[14px] font-semibold text-text-primary">Add Media</h2>
          <button
            type="button"
            onClick={onClose}
            className="grid h-6 w-6 cursor-pointer place-items-center rounded bg-transparent text-[16px] text-text-tertiary transition-colors hover:bg-background-tertiary hover:text-text-primary"
            aria-label="Close"
          >
            &times;
          </button>
        </header>

        <div className="min-h-0 overflow-auto p-4">
          {mediaAssets.length === 0 ? (
            <p className="m-0 text-center text-[12px] text-text-tertiary">
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
                    <p className="m-0 truncate px-1.5 py-1 text-[11px] text-text-secondary group-hover:text-text-primary">
                      {asset.name}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <footer className="flex items-center justify-between border-t border-border-primary px-4 py-3">
          <span className="text-[12px] text-text-tertiary">
            {selectedIds.size > 0 ? `${selectedIds.size} selected` : 'Select media to add'}
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button onClick={handleConfirm} disabled={selectedIds.size === 0}>
              Add{selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}
