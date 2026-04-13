import { isLyricDeckItem } from '@core/deck-items';
import type { DeckItem, Id, PlaylistTree } from '@core/types';

export function resolveCurrentDeckItemId(currentDeckItemId: Id | null, itemIds: Iterable<Id>): Id | null {
  if (!currentDeckItemId) return null;

  for (const itemId of itemIds) {
    if (itemId === currentDeckItemId) return currentDeckItemId;
  }

  return null;
}

export function resolveCurrentPlaylistDeckItemId(currentDeckItemId: Id | null, selectedTree: PlaylistTree | null): Id | null {
  const itemIds = extractPlaylistDeckItemIds(selectedTree);
  if (!currentDeckItemId) return null;
  if (itemIds.includes(currentDeckItemId)) return currentDeckItemId;
  return null;
}

export function resolvePinnedLyricDeckItemId(
  currentDeckItemId: Id | null,
  selectedTree: PlaylistTree | null,
  deckItemsById: ReadonlyMap<Id, DeckItem>,
): Id | null {
  if (currentDeckItemId && isLyricDeckItem(deckItemsById.get(currentDeckItemId) ?? null)) {
    return resolveCurrentDeckItemId(currentDeckItemId, deckItemsById.keys());
  }

  return resolveCurrentPlaylistDeckItemId(currentDeckItemId, selectedTree);
}

export function extractPlaylistDeckItemIds(selectedTree: PlaylistTree | null): Id[] {
  if (!selectedTree) return [];

  const itemIds: Id[] = [];
  for (const segment of selectedTree.segments) {
    for (const entry of segment.entries) {
      itemIds.push(entry.item.id);
    }
  }

  return itemIds;
}

export function findCreatedId(previousIds: Set<Id>, currentIds: Id[]): Id | null {
  for (const id of currentIds) {
    if (!previousIds.has(id)) return id;
  }

  return null;
}
