import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { WorkbenchMode } from '../types/ui';
import { useLocalStorage } from '../hooks/use-local-storage';

type WorkbenchContextValue = {
  state: {
    workbenchMode: WorkbenchMode;
  };
  actions: {
    setWorkbenchMode: (mode: WorkbenchMode) => void;
  };
};

const WorkbenchContext = createContext<WorkbenchContextValue | null>(null);
const STORAGE_KEY = 'lumora.workbench-mode.v1';
const VALID_MODES = new Set<WorkbenchMode>(['show', 'slide-editor', 'overlay-editor', 'template-editor']);

function parseWorkbenchMode(raw: string): WorkbenchMode | null {
  return VALID_MODES.has(raw as WorkbenchMode) ? (raw as WorkbenchMode) : null;
}

export function WorkbenchProvider({ children }: { children: ReactNode }) {
  const [workbenchMode, setWorkbenchMode] = useLocalStorage<WorkbenchMode>(STORAGE_KEY, 'show', parseWorkbenchMode);

  const state = useMemo<WorkbenchContextValue['state']>(() => ({
    workbenchMode,
  }), [workbenchMode]);

  const actions = useMemo<WorkbenchContextValue['actions']>(() => ({
    setWorkbenchMode,
  }), [setWorkbenchMode]);

  const value = useMemo<WorkbenchContextValue>(() => ({
    state,
    actions,
  }), [state, actions]);

  return <WorkbenchContext.Provider value={value}>{children}</WorkbenchContext.Provider>;
}

export function useWorkbench(): WorkbenchContextValue {
  const context = useContext(WorkbenchContext);
  if (!context) throw new Error('useWorkbench must be used within WorkbenchProvider');
  return context;
}
