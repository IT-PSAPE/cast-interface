import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { WorkbenchMode } from '../types/ui';

interface WorkbenchContextValue {
  workbenchMode: WorkbenchMode;
  setWorkbenchMode: (mode: WorkbenchMode) => void;
}

const WorkbenchContext = createContext<WorkbenchContextValue | null>(null);

export function WorkbenchProvider({ children }: { children: ReactNode }) {
  const [workbenchMode, setWorkbenchMode] = useState<WorkbenchMode>('show');
  const value = useMemo(() => ({ workbenchMode, setWorkbenchMode }), [workbenchMode]);
  return <WorkbenchContext.Provider value={value}>{children}</WorkbenchContext.Provider>;
}

export function useWorkbench(): WorkbenchContextValue {
  const context = useContext(WorkbenchContext);
  if (!context) throw new Error('useWorkbench must be used within WorkbenchProvider');
  return context;
}
