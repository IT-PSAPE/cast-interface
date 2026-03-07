import { useMemo } from 'react';
import type { Id, PlaylistTree, Presentation, Slide } from '@core/types';
import { useNavigation } from '../../../contexts/navigation-context';
import { sortSlides } from '../../../utils/slides';

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
  slidesByPresentationId: Map<Id, Slide[]>,
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
  const { activeBundle, currentPlaylistId } = useNavigation();

  const selectedTree = useMemo(() => {
    if (!activeBundle || !currentPlaylistId) return null;
    return activeBundle.playlists.find((tree) => tree.playlist.id === currentPlaylistId) ?? null;
  }, [activeBundle, currentPlaylistId]);

  const slidesByPresentationId = useMemo(() => {
    const map = new Map<Id, Slide[]>();
    if (!activeBundle) return map;
    for (const presentation of activeBundle.presentations) {
      map.set(presentation.id, []);
    }
    for (const slide of activeBundle.slides) {
      const existing = map.get(slide.presentationId);
      if (!existing) continue;
      existing.push(slide);
    }
    map.forEach((slides, presentationId) => {
      map.set(presentationId, sortSlides(slides));
    });
    return map;
  }, [activeBundle]);

  const items = useMemo(() => flattenPlaylistPresentationSequence(selectedTree, slidesByPresentationId), [selectedTree, slidesByPresentationId]);

  return { selectedTree, items };
}
