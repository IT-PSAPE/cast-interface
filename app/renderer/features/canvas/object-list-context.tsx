import { createContext, useContext } from 'react';
import type { Id } from '@core/types';

interface ObjectListContextValue {
  selectedElementId: Id | null;
  onSelect: (id: Id) => void;
}

const ObjectListContext = createContext<ObjectListContextValue | null>(null);

export { ObjectListContext };

export function useObjectList(): ObjectListContextValue {
  const ctx = useContext(ObjectListContext);
  if (!ctx) throw new Error('useObjectList must be used within ObjectListPanel');
  return ctx;
}
