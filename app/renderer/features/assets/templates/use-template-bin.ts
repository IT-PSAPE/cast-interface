import { useCallback, useMemo, useState } from 'react';
import type { Template } from '@core/types';
import { isTemplateCompatibleWithDeckItem } from '@core/templates';
import { useCast } from '../../../contexts/app-context';
import { useTemplateEditor } from '../../../contexts/asset-editor/asset-editor-context';
import { useNavigation } from '../../../contexts/navigation-context';
import { filterByText } from '../../../utils/filter-by-text';
import { compareByKey, useTemplateBinSort } from '../../workbench/use-bin-sort';
import { useBinCollections } from '../../workbench/use-bin-collections';
import type { ResourceDrawerViewMode } from '../../../types/ui';

export function useTemplateBin() {
  const { templates } = useTemplateEditor();
  const { currentDeckItem } = useNavigation();
  const { mutatePatch } = useCast();
  const { sort } = useTemplateBinSort();
  const collections = useBinCollections('template');
  const [searchValue, setSearchValue] = useState('');
  const [viewMode, setViewMode] = useState<ResourceDrawerViewMode>('grid');

  const filteredByCollection = useMemo(
    () => collections.filterByActiveCollection(templates),
    [templates, collections],
  );

  const filteredTemplates = useMemo(() => {
    const filtered = filterByText(filteredByCollection, searchValue, (t) => [t.name, t.kind]);
    const direction = sort.direction === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => direction * compareByKey(a, b, sort.key, (item) => item.name));
  }, [filteredByCollection, searchValue, sort]);

  const handleApplyTemplate = useCallback((template: Template) => {
    if (!currentDeckItem) return;
    if (!isTemplateCompatibleWithDeckItem(template, currentDeckItem.type)) return;
    void mutatePatch(() => window.castApi.applyTemplateToDeckItem(template.id, currentDeckItem.id));
  }, [currentDeckItem, mutatePatch]);

  return {
    filteredTemplates,
    handleApplyTemplate,
    collections,
    searchValue,
    setSearchValue,
    viewMode,
    setViewMode,
  };
}
