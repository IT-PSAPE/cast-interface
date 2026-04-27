import { useCallback, useMemo } from 'react';
import type { Template } from '@core/types';
import { isTemplateCompatibleWithDeckItem } from '@core/templates';
import { useCast } from '../../../contexts/app-context';
import { useTemplateEditor } from '../../../contexts/asset-editor/asset-editor-context';
import { useNavigation } from '../../../contexts/navigation-context';
import { filterByText } from '../../../utils/filter-by-text';
import { compareByKey, useTemplateBinSort } from '../../workbench/use-bin-sort';

export function useTemplateBin(filterText: string) {
  const { templates } = useTemplateEditor();
  const { currentDeckItem } = useNavigation();
  const { mutatePatch } = useCast();
  const { sort } = useTemplateBinSort();

  const filteredTemplates = useMemo(() => {
    const filtered = filterByText(templates, filterText, (t) => [t.name, t.kind]);
    const direction = sort.direction === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => direction * compareByKey(a, b, sort.key, (item) => item.name));
  }, [templates, filterText, sort]);

  const handleApplyTemplate = useCallback((template: Template) => {
    if (!currentDeckItem) return;
    if (!isTemplateCompatibleWithDeckItem(template, currentDeckItem.type)) return;
    void mutatePatch(() => window.castApi.applyTemplateToDeckItem(template.id, currentDeckItem.id));
  }, [currentDeckItem, mutatePatch]);

  return { filteredTemplates, handleApplyTemplate };
}
