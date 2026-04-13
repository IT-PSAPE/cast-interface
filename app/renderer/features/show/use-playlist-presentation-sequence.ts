import { useMemo } from 'react';
import type { DeckItem, Id, PlaylistTree, Slide } from '@core/types';
import { useNavigation } from '../../contexts/navigation-context';
import { useProjectContent } from '../../contexts/use-project-content';

export interface PlaylistPresentationSequenceItem {
  entryId: Id;
  item: DeckItem;
  slides: Slide[];
  occurrenceIndex: number;
}

interface PlaylistPresentationSequence {
  selectedTree: PlaylistTree | null;
  items: PlaylistPresentationSequenceItem[];
}

export function flattenPlaylistPresentationSequence(
  selectedTree: PlaylistTree | null,
  slidesByDeckItemId: ReadonlyMap<Id, Slide[]>,
): PlaylistPresentationSequenceItem[] {
  if (!selectedTree) return [];
  const countsByDeckItemId = new Map<Id, number>();
  const flattened: PlaylistPresentationSequenceItem[] = [];

  for (const segment of selectedTree.segments) {
    for (const entry of segment.entries) {
      const currentCount = countsByDeckItemId.get(entry.item.id) ?? 0;
      const occurrenceIndex = currentCount + 1;
      countsByDeckItemId.set(entry.item.id, occurrenceIndex);
      flattened.push({
        entryId: entry.entry.id,
        item: entry.item,
        slides: slidesByDeckItemId.get(entry.item.id) ?? [],
        occurrenceIndex,
      });
    }
  }

  return flattened;
}

export function usePlaylistPresentationSequence(): PlaylistPresentationSequence {
  const { currentLibraryBundle, currentPlaylistId } = useNavigation();
  const { slidesByDeckItemId } = useProjectContent();

  const selectedTree = useMemo(() => {
    if (!currentLibraryBundle || !currentPlaylistId) return null;
    return currentLibraryBundle.playlists.find((tree) => tree.playlist.id === currentPlaylistId) ?? null;
  }, [currentLibraryBundle, currentPlaylistId]);

  const items = useMemo(() => flattenPlaylistPresentationSequence(selectedTree, slidesByDeckItemId), [selectedTree, slidesByDeckItemId]);

  return { selectedTree, items };
}
