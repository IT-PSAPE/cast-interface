import { isLyricContentItem } from '@core/content-items';
import type { ContentItem, Id, PlaylistTree } from '@core/types';

export function resolveCurrentContentItemId(currentContentItemId: Id | null, itemIds: Iterable<Id>): Id | null {
  if (!currentContentItemId) return null;

  for (const itemId of itemIds) {
    if (itemId === currentContentItemId) return currentContentItemId;
  }

  return null;
}

export function resolveCurrentPlaylistContentItemId(currentContentItemId: Id | null, selectedTree: PlaylistTree | null): Id | null {
  const itemIds = extractPlaylistContentItemIds(selectedTree);
  if (!currentContentItemId) return null;
  if (itemIds.includes(currentContentItemId)) return currentContentItemId;
  return null;
}

export function resolvePinnedLyricContentItemId(
  currentContentItemId: Id | null,
  selectedTree: PlaylistTree | null,
  contentItemsById: ReadonlyMap<Id, ContentItem>,
): Id | null {
  if (currentContentItemId && isLyricContentItem(contentItemsById.get(currentContentItemId) ?? null)) {
    return resolveCurrentContentItemId(currentContentItemId, contentItemsById.keys());
  }

  return resolveCurrentPlaylistContentItemId(currentContentItemId, selectedTree);
}

export function extractPlaylistContentItemIds(selectedTree: PlaylistTree | null): Id[] {
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
