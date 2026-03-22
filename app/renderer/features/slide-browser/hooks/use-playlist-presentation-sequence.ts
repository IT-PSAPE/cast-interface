import { useMemo } from 'react';
import type { ContentItem, Id, PlaylistTree, Slide } from '@core/types';
import { useNavigation } from '../../../contexts/navigation-context';
import { useProjectContent } from '../../../contexts/use-project-content';

export interface PlaylistPresentationSequenceItem {
  entryId: Id;
  item: ContentItem;
  slides: Slide[];
  occurrenceIndex: number;
}

interface PlaylistPresentationSequence {
  selectedTree: PlaylistTree | null;
  items: PlaylistPresentationSequenceItem[];
}

export function flattenPlaylistPresentationSequence(
  selectedTree: PlaylistTree | null,
  slidesByContentItemId: ReadonlyMap<Id, Slide[]>,
): PlaylistPresentationSequenceItem[] {
  if (!selectedTree) return [];
  const countsByContentItemId = new Map<Id, number>();
  const flattened: PlaylistPresentationSequenceItem[] = [];

  for (const segment of selectedTree.segments) {
    for (const entry of segment.entries) {
      const currentCount = countsByContentItemId.get(entry.item.id) ?? 0;
      const occurrenceIndex = currentCount + 1;
      countsByContentItemId.set(entry.item.id, occurrenceIndex);
      flattened.push({
        entryId: entry.entry.id,
        item: entry.item,
        slides: slidesByContentItemId.get(entry.item.id) ?? [],
        occurrenceIndex,
      });
    }
  }

  return flattened;
}

export function usePlaylistPresentationSequence(): PlaylistPresentationSequence {
  const { currentLibraryBundle, currentPlaylistId } = useNavigation();
  const { slidesByContentItemId } = useProjectContent();

  const selectedTree = useMemo(() => {
    if (!currentLibraryBundle || !currentPlaylistId) return null;
    return currentLibraryBundle.playlists.find((tree) => tree.playlist.id === currentPlaylistId) ?? null;
  }, [currentLibraryBundle, currentPlaylistId]);

  const items = useMemo(() => flattenPlaylistPresentationSequence(selectedTree, slidesByContentItemId), [selectedTree, slidesByContentItemId]);

  return { selectedTree, items };
}
