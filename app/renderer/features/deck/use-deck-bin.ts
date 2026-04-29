import { useMemo, useState } from 'react';
import type { DeckItem, Id } from '@core/types';
import { useNavigation } from '../../contexts/navigation-context';
import { useProjectContent } from '../../contexts/use-project-content';
import { filterByText } from '../../utils/filter-by-text';
import { useLibraryPanelManagement } from '../library/use-library-panel-management';
import { useDeckBinSort, compareByKey, type BinSort, type DeckBinSortKey } from '../workbench/use-bin-sort';

export function useDeckBin(filterText: string) {
  const {
    currentDrawerDeckItemId,
    browseDeckItem,
    isDetachedDeckBrowser,
  } = useNavigation();
  const { deckItems, slidesByDeckItemId } = useProjectContent();
  const {
    renameDeckItem,
  } = useLibraryPanelManagement();
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

  function handleRename(itemId: Id, title: string) {
    void renameDeckItem(itemId, title);
    setEditingPresentationId(null);
  }

  return {
    filteredDeckItems,
    editingDeckItemId,
    browseDeckItem,
    isDetachedDeckBrowser,
    currentDrawerDeckItemId,
    handleRename,
    slidesByDeckItemId,
  };
}

function sortDeckItems(items: DeckItem[], sort: BinSort<DeckBinSortKey>, slidesByDeckItemId: ReadonlyMap<Id, unknown[]>): DeckItem[] {
  const direction = sort.direction === 'asc' ? 1 : -1;
  const sorted = [...items];
  sorted.sort((a, b) => {
    if (sort.key === 'slides') {
      const aCount = slidesByDeckItemId.get(a.id)?.length ?? 0;
      const bCount = slidesByDeckItemId.get(b.id)?.length ?? 0;
      return direction * (aCount - bCount);
    }
    return direction * compareByKey(a, b, sort.key, (item) => item.title);
  });
  return sorted;
}
