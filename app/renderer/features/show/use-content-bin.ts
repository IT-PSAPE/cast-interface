import { useMemo, useState } from 'react';
import type { Id } from '@core/types';
import type { ContextMenuItem } from '../../components/overlays/context-menu';
import { useNavigation } from '../../contexts/navigation-context';
import { useProjectContent } from '../../contexts/use-project-content';
import { useContextMenuState } from '../../hooks/use-context-menu-state';
import { filterByText } from '../../utils/filter-by-text';
import { buildContentItemMenuItems } from './build-presentation-menu-items';
import { useLibraryPanelManagement } from './use-library-panel-management';

export function useContentBin(filterText: string) {
  const {
    currentDrawerContentItemId,
    currentPlaylistId,
    currentLibraryBundle,
    browseContentItem,
    isDetachedContentBrowser,
  } = useNavigation();
  const { contentItems, slidesByContentItemId } = useProjectContent();
  const {
    renameContentItem,
    deleteContentItem,
    moveContentItem,
    moveContentItemToSegment,
  } = useLibraryPanelManagement();
  const menu = useContextMenuState<Id>();
  const [editingPresentationId, setEditingPresentationId] = useState<Id | null>(null);

  const filteredPresentations = useMemo(() => {
    return filterByText(contentItems, filterText, (item) => {
      const slides = slidesByContentItemId.get(item.id) ?? [];
      const slideLabels = slides.map((slide) => `slide ${slide.order + 1}`);
      return [item.title, item.type, ...slideLabels];
    });
  }, [contentItems, filterText, slidesByContentItemId]);

  const menuItems = useMemo<ContextMenuItem[]>(() => {
    if (!menu.menuState) return [];
    return buildContentItemMenuItems({
      itemId: menu.menuState.data,
      scope: 'library',
      currentPlaylistId,
      selectedTree: currentLibraryBundle?.playlists.find((tree) => tree.playlist.id === currentPlaylistId) ?? null,
      itemIds: contentItems.map((item) => item.id),
      selectContentItem: browseContentItem,
      moveContentItem,
      moveContentItemToSegment,
      beginRenameContentItem: setEditingPresentationId,
      deleteContentItem,
    });
  }, [browseContentItem, contentItems, currentLibraryBundle, currentPlaylistId, deleteContentItem, menu.menuState, moveContentItem, moveContentItemToSegment]);

  function handleRename(itemId: Id, title: string) {
    void renameContentItem(itemId, title);
    setEditingPresentationId(null);
  }

  return {
    filteredPresentations,
    menu,
    menuItems,
    editingPresentationId,
    browseContentItem,
    isDetachedContentBrowser,
    currentDrawerContentItemId,
    handleRename,
    slidesByContentItemId,
  };
}
