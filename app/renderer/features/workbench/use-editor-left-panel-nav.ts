import { useEffect } from 'react';
import type { Id } from '@core/types';
import { useElements } from '../../contexts/canvas/canvas-context';

interface NavItem {
  id: Id;
}

interface UseEditorLeftPanelNavOptions<T extends NavItem> {
  items: readonly T[];
  currentId: Id | null;
  activate: (id: Id, index: number) => void;
}

export function useEditorLeftPanelNav<T extends NavItem>({ items, currentId, activate }: UseEditorLeftPanelNavOptions<T>) {
  const { selectedElementId } = useElements();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      if (selectedElementId) return;
      const target = event.target as HTMLElement | null;
      const isEditable = target?.tagName === 'INPUT'
        || target?.tagName === 'TEXTAREA'
        || target?.getAttribute('contenteditable') === 'true';
      if (isEditable) return;
      if (items.length === 0) return;

      const currentIndex = currentId ? items.findIndex((item) => item.id === currentId) : -1;
      const delta = event.key === 'ArrowDown' ? 1 : -1;
      const resolvedIndex = currentIndex === -1 ? 0 : currentIndex + delta;
      const nextIndex = Math.max(0, Math.min(items.length - 1, resolvedIndex));
      if (nextIndex === currentIndex) return;
      event.preventDefault();
      activate(items[nextIndex].id, nextIndex);
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [items, currentId, activate, selectedElementId]);
}
