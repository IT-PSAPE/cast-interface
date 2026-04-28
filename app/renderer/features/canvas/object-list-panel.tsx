import { useMemo } from 'react';
import type { Id } from '@core/types';
import { useElements } from '../../contexts/canvas/canvas-context';
import { useInspector } from './inspector-context';
import { useWorkbench } from '../../contexts/workbench-context';
import { LAYER_ORDER } from '../../types/ui';
import { ObjectListRow } from './object-list-row';
import { ObjectListContext } from './object-list-context';
import { EmptyState } from '../../components/display/empty-state';

export function ObjectListPanel() {
  const { effectiveElements, selectedElementId, selectElement } = useElements();
  const { setInspectorTab } = useInspector();
  const { state: { workbenchMode } } = useWorkbench();
  const isOverlayEdit = workbenchMode === 'overlay-editor';
  const isTemplateEdit = workbenchMode === 'template-editor';

  const orderedElements = useMemo(() => {
    return effectiveElements
      .slice()
      .sort((a, b) => {
        const layerDiff = LAYER_ORDER[b.layer] - LAYER_ORDER[a.layer];
        if (layerDiff !== 0) return layerDiff;
        return b.zIndex - a.zIndex;
      });
  }, [effectiveElements]);

  function handleSelect(id: Id) {
    const target = effectiveElements.find((element) => element.id === id);
    selectElement(id);
    setInspectorTab(target?.type === 'text' ? 'text' : 'shape');
  }

  const contextValue = useMemo(() => ({
    selectedElementId,
    onSelect: handleSelect,
  }), [selectedElementId, effectiveElements]);

  if (orderedElements.length === 0) {
    return (
      <EmptyState.Root data-ui-region="object-list-panel">
        <EmptyState.Title>
          {isOverlayEdit ? 'No objects in this overlay.' : isTemplateEdit ? 'No objects in this template.' : 'No objects on this slide.'}
        </EmptyState.Title>
      </EmptyState.Root>
    );
  }

  return (
    <ObjectListContext.Provider value={contextValue}>
      <div data-ui-region="object-list-panel" className="flex flex-col gap-1.5 w-full">
        {orderedElements.map((element) => (
          <ObjectListRow key={element.id} element={element} />
        ))}
      </div>
    </ObjectListContext.Provider>
  );
}
