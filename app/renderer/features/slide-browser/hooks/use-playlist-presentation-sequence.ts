import { useMemo } from 'react';
import type { Id, PlaylistTree, Presentation, Slide } from '@core/types';
import { useNavigation } from '../../../contexts/navigation-context';
import { useProjectContent } from '../../../contexts/use-project-content';

export interface PlaylistPresentationSequenceItem {
  entryId: Id;
  presentation: Presentation;
  slides: Slide[];
  occurrenceIndex: number;
}

interface PlaylistPresentationSequence {
  selectedTree: PlaylistTree | null;
  items: PlaylistPresentationSequenceItem[];
}

export function flattenPlaylistPresentationSequence(
  selectedTree: PlaylistTree | null,
  slidesByPresentationId: ReadonlyMap<Id, Slide[]>,
): PlaylistPresentationSequenceItem[] {
  if (!selectedTree) return [];
  const countsByPresentationId = new Map<Id, number>();
  const flattened: PlaylistPresentationSequenceItem[] = [];

  for (const segment of selectedTree.segments) {
    for (const entry of segment.entries) {
      const currentCount = countsByPresentationId.get(entry.presentation.id) ?? 0;
      const occurrenceIndex = currentCount + 1;
      countsByPresentationId.set(entry.presentation.id, occurrenceIndex);
      flattened.push({
        entryId: entry.entry.id,
        presentation: entry.presentation,
        slides: slidesByPresentationId.get(entry.presentation.id) ?? [],
        occurrenceIndex,
      });
    }
  }

  return flattened;
}

export function usePlaylistPresentationSequence(): PlaylistPresentationSequence {
  const { currentLibraryBundle, currentPlaylistId } = useNavigation();
  const { slidesByPresentationId } = useProjectContent();

  const selectedTree = useMemo(() => {
    if (!currentLibraryBundle || !currentPlaylistId) return null;
    return currentLibraryBundle.playlists.find((tree) => tree.playlist.id === currentPlaylistId) ?? null;
  }, [currentLibraryBundle, currentPlaylistId]);

  const items = useMemo(() => flattenPlaylistPresentationSequence(selectedTree, slidesByPresentationId), [selectedTree, slidesByPresentationId]);

  return { selectedTree, items };
}
