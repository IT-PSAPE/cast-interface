import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { WorkbenchMode } from '../types/ui';

interface WorkbenchContextValue {
  workbenchMode: WorkbenchMode;
  setWorkbenchMode: (mode: WorkbenchMode) => void;
}

const WorkbenchContext = createContext<WorkbenchContextValue | null>(null);
const STORAGE_KEY = 'cast-interface.workbench-mode.v1';

export function WorkbenchProvider({ children }: { children: ReactNode }) {
  const [workbenchMode, setWorkbenchModeState] = useState<WorkbenchMode>(getStoredWorkbenchMode);
  const setWorkbenchMode = (mode: WorkbenchMode) => {
    setWorkbenchModeState(mode);
    window.localStorage.setItem(STORAGE_KEY, mode);
  };
  const value = useMemo(() => ({ workbenchMode, setWorkbenchMode }), [workbenchMode]);
  return <WorkbenchContext.Provider value={value}>{children}</WorkbenchContext.Provider>;
}

export function useWorkbench(): WorkbenchContextValue {
  const context = useContext(WorkbenchContext);
  if (!context) throw new Error('useWorkbench must be used within WorkbenchProvider');
  return context;
}

function getStoredWorkbenchMode(): WorkbenchMode {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'show' || stored === 'slide-editor' || stored === 'overlay-editor' || stored === 'template-editor') {
    return stored;
  }
  return 'show';
}
