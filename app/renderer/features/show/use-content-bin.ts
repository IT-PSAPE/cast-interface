import { useMemo, useState } from 'react';
import type { Id } from '@core/types';
import type { ContextMenuItem } from '../../components/overlays/context-menu';
import { useNavigation } from '../../contexts/navigation-context';
import { useProjectContent } from '../../contexts/use-project-content';
import { useContextMenuState } from '../../hooks/use-context-menu-state';
import { filterByText } from '../../utils/filter-by-text';
import { buildDeckItemMenuItems } from './build-presentation-menu-items';
import { useLibraryPanelManagement } from './use-library-panel-management';

export function useContentBin(filterText: string) {
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
    moveDeckItemToSegment,
  } = useLibraryPanelManagement();
  const menu = useContextMenuState<Id>();
  const [editingPresentationId, setEditingPresentationId] = useState<Id | null>(null);

  const filteredPresentations = useMemo(() => {
    return filterByText(deckItems, filterText, (item) => {
      const slides = slidesByDeckItemId.get(item.id) ?? [];
      const slideLabels = slides.map((slide) => `slide ${slide.order + 1}`);
      return [item.title, item.type, ...slideLabels];
    });
  }, [deckItems, filterText, slidesByDeckItemId]);

  const menuItems = useMemo<ContextMenuItem[]>(() => {
    if (!menu.menuState) return [];
    return buildDeckItemMenuItems({
      itemId: menu.menuState.data,
      scope: 'library',
      currentPlaylistId,
      selectedTree: currentLibraryBundle?.playlists.find((tree) => tree.playlist.id === currentPlaylistId) ?? null,
      itemIds: deckItems.map((item) => item.id),
      selectDeckItem: browseDeckItem,
      moveDeckItem,
      moveDeckItemToSegment,
      beginRenameDeckItem: setEditingPresentationId,
      deleteDeckItem,
    });
  }, [browseDeckItem, deckItems, currentLibraryBundle, currentPlaylistId, deleteDeckItem, menu.menuState, moveDeckItem, moveDeckItemToSegment]);

  function handleRename(itemId: Id, title: string) {
    void renameDeckItem(itemId, title);
    setEditingPresentationId(null);
  }

  return {
    filteredPresentations,
    menu,
    menuItems,
    editingPresentationId,
    browseDeckItem,
    isDetachedDeckBrowser,
    currentDrawerDeckItemId,
    handleRename,
    slidesByDeckItemId,
  };
}
