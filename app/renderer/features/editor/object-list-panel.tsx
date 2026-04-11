import { useMemo, useState } from 'react';
import type { Id, SlideElement } from '@core/types';
import { useElements } from '../../contexts/element/element-context';
import { useInspector } from '../inspector/inspector-context';
import { useWorkbench } from '../../contexts/workbench-context';
import { LAYER_ORDER } from '../../types/ui';
import { ObjectListRow } from './object-list-row';
import { reorderElementStack, type StackDropPlacement } from './reorder-element-stack';

interface DropTarget {
  elementId: Id;
  placement: StackDropPlacement;
}

export function ObjectListPanel() {
  const {
    commitElementUpdates,
    effectiveElements,
    selectedElementId,
    selectElement,
    toggleElementVisibility,
    toggleElementLock,
  } = useElements();
  const { setInspectorTab } = useInspector();
  const { state: { workbenchMode } } = useWorkbench();
  const isOverlayEdit = workbenchMode === 'overlay-editor';
  const isTemplateEdit = workbenchMode === 'template-editor';
  const [draggingId, setDraggingId] = useState<Id | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);

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

  function handleDragStart(id: Id, event: React.DragEvent<HTMLButtonElement>) {
    handleSelect(id);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', id);
    setDraggingId(id);
    setDropTarget(null);
  }

  function handleDragEnd() {
    setDraggingId(null);
    setDropTarget(null);
  }

  function handleDragOver(id: Id, event: React.DragEvent<HTMLButtonElement>) {
    if (!draggingId || draggingId === id) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';

    const placement = resolveDropPlacement(event);
    setDropTarget((current) => {
      if (current?.elementId === id && current.placement === placement) return current;
      return { elementId: id, placement };
    });
  }

  function handleDrop(id: Id, event: React.DragEvent<HTMLButtonElement>) {
    event.preventDefault();

    if (!draggingId || draggingId === id) {
      handleDragEnd();
      return;
    }

    const placement = resolveDropPlacement(event);
    const updates = reorderElementStack({
      elements: effectiveElements,
      movingId: draggingId,
      targetId: id,
      placement,
    });

    handleDragEnd();
    if (updates.length === 0) return;
    void commitElementUpdates(updates);
  }

  function renderRow(element: SlideElement) {
    return (
      <ObjectListRow
        key={element.id}
        element={element}
        dragging={element.id === draggingId}
        dropPlacement={dropTarget?.elementId === element.id ? dropTarget.placement : null}
        selected={element.id === selectedElementId}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragStart={handleDragStart}
        onDrop={handleDrop}
        onSelect={handleSelect}
        onToggleLock={handleToggleLock}
        onToggleVisibility={handleToggleVisibility}
      />
    );
  }

  if (orderedElements.length === 0) {
    return (
      <div
        data-ui-region="object-list-panel"
        className="grid h-full place-items-center rounded border border-secondary bg-tertiary/20 text-sm text-tertiary"
      >
        {isOverlayEdit ? 'No objects in this overlay.' : isTemplateEdit ? 'No objects in this template.' : 'No objects on this slide.'}
      </div>
    );
  }

  return (
    <div data-ui-region="object-list-panel" className="flex flex-col gap-1.5">
      {orderedElements.map(renderRow)}
    </div>
  );
}

function resolveDropPlacement(event: React.DragEvent<HTMLButtonElement>): StackDropPlacement {
  const bounds = event.currentTarget.getBoundingClientRect();
  return event.clientY < bounds.top + (bounds.height / 2) ? 'before' : 'after';
}
