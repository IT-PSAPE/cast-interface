import { useMemo } from 'react';
import { useWorkbench } from '../../../contexts/workbench-context';
import { useElements } from '../../../contexts/element-context';
import type { InspectorTab } from '../../../types/ui';

export interface InspectorTabDefinition {
  name: InspectorTab;
  label: string;
}

export function useAvailableInspectorTabs(): InspectorTabDefinition[] {
  const { workbenchMode } = useWorkbench();
  const { selectedElement } = useElements();
  const hasSelection = Boolean(selectedElement);
  const isOverlayEdit = workbenchMode === 'overlay-editor';
  const isTemplateEdit = workbenchMode === 'template-editor';
  const isTextSelected = hasSelection && selectedElement?.type === 'text';

  return useMemo(() => {
    const tabs: InspectorTabDefinition[] = [];
    if (isTemplateEdit) {
      if (hasSelection) tabs.push({ name: 'shape', label: 'Shape' });
      if (isTextSelected) tabs.push({ name: 'text', label: 'Text' });
      return tabs;
    }
    if (!isOverlayEdit && !hasSelection) tabs.push({ name: 'presentation', label: 'Item' });
    if (isOverlayEdit && !hasSelection) tabs.push({ name: 'slide', label: 'Overlay' });
    if (hasSelection) tabs.push({ name: 'shape', label: 'Shape' });
    if (isTextSelected) tabs.push({ name: 'text', label: 'Text' });
    return tabs;
  }, [isOverlayEdit, isTemplateEdit, hasSelection, isTextSelected]);
}
