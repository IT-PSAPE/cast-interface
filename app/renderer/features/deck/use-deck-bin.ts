import { useMemo, useState } from 'react';
import type { DeckItem, Id } from '@core/types';
import type { ContextMenuItem } from '../../components/overlays/context-menu';
import { useNavigation } from '../../contexts/navigation-context';
import { useProjectContent } from '../../contexts/use-project-content';
import { useContextMenuState } from '../../hooks/use-context-menu-state';
import { filterByText } from '../../utils/filter-by-text';
import { buildDeckItemMenuItems } from './build-deck-menu-items';
import { useLibraryPanelManagement } from '../library/use-library-panel-management';
import { useDeckBinSort, type DeckBinSort } from './use-deck-bin-sort';

export function useDeckBin(filterText: string) {
  const {
    currentDrawerDeckItemId,
    currentPlaylistId,
    currentLibraryBundle,
    browseDeckItem,
    isDetachedDeckBrowser,
  } = useNavigation();
  const { deckItems, slidesByDeckItemId } = useProjectContent();
  const {
    renameDeckItem,
    deleteDeckItem,
    moveDeckItem,
    movePlaylistEntryToSegment,
  } = useLibraryPanelManagement();
  const menu = useContextMenuState<Id>();
  const [editingDeckItemId, setEditingPresentationId] = useState<Id | null>(null);
  const { sort } = useDeckBinSort();

  const filteredDeckItems = useMemo(() => {
    const filtered = filterByText(deckItems, filterText, (item) => {
      const slides = slidesByDeckItemId.get(item.id) ?? [];
      const slideLabels = slides.map((slide) => `slide ${slide.order + 1}`);
      return [item.title, item.type, ...slideLabels];
    });
    return sortDeckItems(filtered, sort, slidesByDeckItemId);
  }, [deckItems, filterText, slidesByDeckItemId, sort]);

  const menuItems = useMemo<ContextMenuItem[]>(() => {
    if (!menu.menuState) return [];
    return buildDeckItemMenuItems({
      itemId: menu.menuState.data,
      scope: 'library',
      selectedTree: currentLibraryBundle?.playlists.find((tree) => tree.playlist.id === currentPlaylistId) ?? null,
      itemIds: deckItems.map((item) => item.id),
      moveDeckItem,
      movePlaylistEntryToSegment,
      beginRenameDeckItem: setEditingPresentationId,
      deleteDeckItem,
    });
  }, [browseDeckItem, deckItems, currentLibraryBundle, currentPlaylistId, deleteDeckItem, menu.menuState, moveDeckItem, movePlaylistEntryToSegment]);

  function handleRename(itemId: Id, title: string) {
    void renameDeckItem(itemId, title);
    setEditingPresentationId(null);
  }

  return {
    filteredDeckItems,
    menu,
    menuItems,
    editingDeckItemId,
    browseDeckItem,
    isDetachedDeckBrowser,
    currentDrawerDeckItemId,
    handleRename,
    slidesByDeckItemId,
  };
}

function sortDeckItems(items: DeckItem[], sort: DeckBinSort, slidesByDeckItemId: ReadonlyMap<Id, unknown[]>): DeckItem[] {
  const direction = sort.direction === 'asc' ? 1 : -1;
  const sorted = [...items];
  sorted.sort((a, b) => {
    switch (sort.key) {
      case 'name':
        return direction * a.title.localeCompare(b.title);
      case 'created':
        return direction * a.createdAt.localeCompare(b.createdAt);
      case 'modified':
        return direction * a.updatedAt.localeCompare(b.updatedAt);
      case 'slides': {
        const aCount = slidesByDeckItemId.get(a.id)?.length ?? 0;
        const bCount = slidesByDeckItemId.get(b.id)?.length ?? 0;
        return direction * (aCount - bCount);
      }
    }
  });
  return sorted;
}
