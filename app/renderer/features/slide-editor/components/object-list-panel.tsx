import { useMemo } from 'react';
import type { Id, SlideElement } from '@core/types';
import { useElements } from '../../../contexts/element-context';
import { useInspector } from '../../../contexts/inspector-context';
import { useWorkbench } from '../../../contexts/workbench-context';
import { LAYER_ORDER } from '../../../types/ui';
import { ObjectListRow } from './object-list-row';

export function ObjectListPanel() {
  const { effectiveElements, selectedElementId, selectElement, toggleElementVisibility, toggleElementLock } = useElements();
  const { setInspectorTab } = useInspector();
  const { workbenchMode } = useWorkbench();
  const isOverlayEdit = workbenchMode === 'overlay-editor';

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

  function handleToggleVisibility(id: Id, visible: boolean) {
    void toggleElementVisibility(id, visible);
  }

  function handleToggleLock(id: Id, locked: boolean) {
    void toggleElementLock(id, locked);
  }

  function renderRow(element: SlideElement) {
    return (
      <ObjectListRow
        key={element.id}
        element={element}
        selected={element.id === selectedElementId}
        onSelect={handleSelect}
        onToggleLock={handleToggleLock}
        onToggleVisibility={handleToggleVisibility}
      />
    );
  }

  if (orderedElements.length === 0) {
    return <div className="grid h-full place-items-center rounded border border-border-secondary bg-background-tertiary/20 text-[12px] text-text-tertiary">{isOverlayEdit ? 'No objects in this overlay.' : 'No objects on this slide.'}</div>;
  }

  return (
    <div className="grid content-start gap-1.5">
      {orderedElements.map(renderRow)}
    </div>
  );
}
