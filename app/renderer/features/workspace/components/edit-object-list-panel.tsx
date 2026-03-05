import { useMemo } from 'react';
import type { Id, SlideElement } from '@core/types';
import { useElements } from '../../../contexts/element-context';
import { useUI } from '../../../contexts/ui-context';
import { LAYER_ORDER } from '../../../types/ui';
import { EditObjectRow } from './edit-object-row';

export function EditObjectListPanel() {
  const { effectiveElements, selectedElementId, selectElement, toggleElementVisibility, toggleElementLock } = useElements();
  const { setInspectorTab } = useUI();

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
    selectElement(id);
    setInspectorTab('shape');
  }

  function handleToggleVisibility(id: Id, visible: boolean) {
    void toggleElementVisibility(id, visible);
  }

  function handleToggleLock(id: Id, locked: boolean) {
    void toggleElementLock(id, locked);
  }

  function renderRow(element: SlideElement) {
    return (
      <EditObjectRow
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
    return <div className="grid h-full place-items-center rounded border border-stroke-light bg-surface-2/20 text-[12px] text-text-muted">No objects on this slide.</div>;
  }

  return (
    <div className="grid content-start gap-1.5">
      {orderedElements.map(renderRow)}
    </div>
  );
}
