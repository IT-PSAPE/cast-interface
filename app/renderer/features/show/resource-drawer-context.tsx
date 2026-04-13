import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { DrawerTab, ResourceDrawerViewMode } from '../../types/ui';

interface ResourceDrawerContextValue {
  drawerTab: DrawerTab;
  drawerViewMode: ResourceDrawerViewMode;
  setDrawerTab: (tab: DrawerTab) => void;
  setDrawerViewMode: (mode: ResourceDrawerViewMode) => void;
}

const ResourceDrawerContext = createContext<ResourceDrawerContextValue | null>(null);
const STORAGE_KEY = 'recast.resource-drawer-view.v1';

function resolveInitialViewMode(): ResourceDrawerViewMode {
  if (typeof window === 'undefined') return 'grid';

  const persisted = window.localStorage.getItem(STORAGE_KEY);
  return persisted === 'list' ? 'list' : 'grid';
}

export function ResourceDrawerProvider({ children }: { children: ReactNode }) {
  const [drawerTab, setDrawerTab] = useState<DrawerTab>('media');
  const [drawerViewMode, setDrawerViewModeState] = useState<ResourceDrawerViewMode>(resolveInitialViewMode);

  function setDrawerViewMode(mode: ResourceDrawerViewMode) {
    setDrawerViewModeState(mode);
    window.localStorage.setItem(STORAGE_KEY, mode);
  }

  const value = useMemo(
    () => ({ drawerTab, drawerViewMode, setDrawerTab, setDrawerViewMode }),
    [drawerTab, drawerViewMode],
  );
  return <ResourceDrawerContext.Provider value={value}>{children}</ResourceDrawerContext.Provider>;
}

export function useResourceDrawer(): ResourceDrawerContextValue {
  const context = useContext(ResourceDrawerContext);
  if (!context) throw new Error('useResourceDrawer must be used within ResourceDrawerProvider');
  return context;
}
