import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { Id } from '@core/types';
import type { StackDropPlacement } from './reorder-element-stack';

interface ObjectListContextValue {
  selectedElementId: Id | null;
  draggingId: Id | null;
  dropTarget: { elementId: Id; placement: StackDropPlacement } | null;
  onSelect: (id: Id) => void;
  onDragStart: (id: Id, event: React.DragEvent<HTMLButtonElement>) => void;
  onDragEnd: () => void;
  onDragOver: (id: Id, event: React.DragEvent<HTMLButtonElement>) => void;
  onDrop: (id: Id, event: React.DragEvent<HTMLButtonElement>) => void;
  onToggleLock: (id: Id, locked: boolean) => void;
  onToggleVisibility: (id: Id, visible: boolean) => void;
}

const ObjectListContext = createContext<ObjectListContextValue | null>(null);

export { ObjectListContext };

export function useObjectList(): ObjectListContextValue {
  const ctx = useContext(ObjectListContext);
  if (!ctx) throw new Error('useObjectList must be used within ObjectListPanel');
  return ctx;
}
