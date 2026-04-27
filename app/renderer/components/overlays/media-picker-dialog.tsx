import { useState } from 'react';
import type { Id, MediaAsset } from '@core/types';
import { cn } from '@renderer/utils/cn';
import { ReacstButton } from '@renderer/components 2.0/button';
import { Dialog } from './dialog';
import { MediaAssetIcon } from '../display/entity-icon';

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
  return <span className="text-sm font-bold uppercase tracking-wider text-tertiary">{asset.type}</span>;
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

  return (
    <Dialog.Root open onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content data-ui-region="media-picker-dialog" className="max-w-[480px] overflow-hidden">
            <Dialog.Header>
              <Dialog.Title>Add Media</Dialog.Title>
              <Dialog.CloseButton />
            </Dialog.Header>
            <Dialog.Body className="overflow-hidden">
              <div className="min-h-0 overflow-auto p-4">
                {mediaAssets.length === 0 ? (
                  <p className="m-0 text-center text-sm text-tertiary">
                    No media assets in the project. Import media from the drawer first.
                  </p>
                ) : (
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-3">
                    {mediaAssets.map((asset) => {
                      const isSelected = selectedIds.has(asset.id);

                      function handleClick() {
                        toggleAsset(asset.id);
                      }

                      return (
                        <button
                          key={asset.id}
                          type="button"
                          onClick={handleClick}
                          className={cn('group cursor-pointer rounded border bg-primary p-0 text-left transition-colors', isSelected ? 'border-brand ring-1 ring-brand-400' : 'border-primary')}
                        >
                          <div className="grid aspect-square place-items-center overflow-hidden rounded-t">
                            <MediaThumbnail asset={asset} />
                          </div>
                          <p className="m-0 flex items-center gap-1.5 truncate px-1.5 py-1 text-sm text-secondary group-hover:text-primary">
                            <MediaAssetIcon asset={asset} size={12} strokeWidth={1.75} className="shrink-0 text-tertiary" />
                            <span className="truncate">{asset.name}</span>
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </Dialog.Body>
            <Dialog.Footer>
              <span className="text-sm text-tertiary">
                {selectedIds.size > 0 ? `${selectedIds.size} selected` : 'Select media to add'}
              </span>
              <div className="flex gap-2">
                <ReacstButton variant="ghost" onClick={onClose}>Cancel</ReacstButton>
                <ReacstButton onClick={handleConfirm} disabled={selectedIds.size === 0}>
                  Add{selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}
                </ReacstButton>
              </div>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
