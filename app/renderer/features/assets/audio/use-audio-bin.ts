import { useMemo } from 'react';
import { useAudio } from '../../../contexts/playback/playback-context';
import { filterByText } from '../../../utils/filter-by-text';
import { compareByKey, useAudioBinSort } from '../../workbench/use-bin-sort';

export function useAudioBin(filterText: string) {
  const { audioAssets: allAudioAssets, currentAudioAssetId, armAudio } = useAudio();
  const { sort } = useAudioBinSort();

  const audioAssets = useMemo(() => {
    const filtered = filterByText(allAudioAssets, filterText, (asset) => [asset.name]);
    const direction = sort.direction === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => direction * compareByKey(a, b, sort.key, (item) => item.name));
  }, [allAudioAssets, filterText, sort]);

  return { audioAssets, currentAudioAssetId, armAudio };
}
