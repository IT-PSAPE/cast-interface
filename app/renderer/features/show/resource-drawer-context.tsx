import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { DrawerTab } from '../../types/ui';

interface ResourceDrawerContextValue {
  drawerTab: DrawerTab;
  setDrawerTab: (tab: DrawerTab) => void;
}

const ResourceDrawerContext = createContext<ResourceDrawerContextValue | null>(null);

export function ResourceDrawerProvider({ children }: { children: ReactNode }) {
  const [drawerTab, setDrawerTab] = useState<DrawerTab>('media');
  const value = useMemo(() => ({ drawerTab, setDrawerTab }), [drawerTab]);
  return <ResourceDrawerContext.Provider value={value}>{children}</ResourceDrawerContext.Provider>;
}

export function useResourceDrawer(): ResourceDrawerContextValue {
  const context = useContext(ResourceDrawerContext);
  if (!context) throw new Error('useResourceDrawer must be used within ResourceDrawerProvider');
  return context;
}
