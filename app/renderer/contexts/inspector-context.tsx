import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { InspectorTab } from '../types/ui';

interface InspectorContextValue {
  inspectorTab: InspectorTab;
  setInspectorTab: (tab: InspectorTab) => void;
}

const InspectorContext = createContext<InspectorContextValue | null>(null);

export function InspectorProvider({ children }: { children: ReactNode }) {
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>('presentation');
  const value = useMemo(() => ({ inspectorTab, setInspectorTab }), [inspectorTab]);
  return <InspectorContext.Provider value={value}>{children}</InspectorContext.Provider>;
}

export function useInspector(): InspectorContextValue {
  const context = useContext(InspectorContext);
  if (!context) throw new Error('useInspector must be used within InspectorProvider');
  return context;
}
