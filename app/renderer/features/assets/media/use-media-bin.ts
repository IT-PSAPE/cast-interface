import { useMemo, useRef } from 'react';
import type { Id } from '@core/types';
import type { ContextMenuItem } from '../../../components/overlays/context-menu';
import { useElements } from '../../../contexts/canvas/canvas-context';
import { usePresentationLayers } from '../../../contexts/playback/playback-context';
import { useProjectContent } from '../../../contexts/use-project-content';
import { useContextMenuState } from '../../../hooks/use-context-menu-state';
import { filterByText } from '../../../utils/filter-by-text';
import { compareByKey, useMediaBinSort } from '../../workbench/use-bin-sort';

export function useMediaBin(filterText: string) {
  const { mediaAssets: allMediaAssets } = useProjectContent();
  const { mediaLayerAssetId, setMediaLayerAsset } = usePresentationLayers();
  const { deleteMedia, changeMediaSrc } = useElements();
  const { sort } = useMediaBinSort();
  const menu = useContextMenuState<Id>();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const changeSrcTargetRef = useRef<Id | null>(null);

  const mediaAssets = useMemo(() => {
    const filtered = filterByText(
      allMediaAssets.filter((asset) => asset.type !== 'audio'),
      filterText,
      (asset) => [asset.name, asset.type],
    );
    const direction = sort.direction === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => direction * compareByKey(a, b, sort.key, (item) => item.name));
  }, [allMediaAssets, filterText, sort]);

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
      { id: 'replace-src', label: 'Replace Source', onSelect: () => handleChangeSrc(assetId) },
      { id: 'delete', label: 'Delete', danger: true, onSelect: () => handleDelete(assetId) },
    ];
  }

  function handleChangeSourceSelect(_files: FileList, event: React.ChangeEvent<HTMLInputElement>) {
    handleFileChange(event);
  }

  return { mediaAssets, mediaLayerAssetId, setMediaLayerAsset, menu, fileInputRef, buildMenuItems, handleChangeSourceSelect };
}
