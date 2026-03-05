import { createContext, useContext, useState, useMemo, type ReactNode } from 'react';
import type { CanvasViewMode, DrawerTab, InspectorTab, WorkspaceView } from '../types/ui';

interface UIContextValue {
  workspaceView: WorkspaceView;
  canvasViewMode: CanvasViewMode;
  drawerTab: DrawerTab;
  inspectorTab: InspectorTab;
  setWorkspaceView: (view: WorkspaceView) => void;
  setCanvasViewMode: (mode: CanvasViewMode) => void;
  setDrawerTab: (tab: DrawerTab) => void;
  setInspectorTab: (tab: InspectorTab) => void;
}

const UIContext = createContext<UIContextValue | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const [workspaceView, setWorkspaceView] = useState<WorkspaceView>('show');
  const [canvasViewMode, setCanvasViewMode] = useState<CanvasViewMode>('grid');
  const [drawerTab, setDrawerTab] = useState<DrawerTab>('media');
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>('presentation');

  const value = useMemo<UIContextValue>(
    () => ({
      workspaceView,
      canvasViewMode, drawerTab, inspectorTab,
      setWorkspaceView,
      setCanvasViewMode, setDrawerTab, setInspectorTab,
    }),
    [workspaceView, canvasViewMode, drawerTab, inspectorTab],
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI(): UIContextValue {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used within UIProvider');
  return ctx;
}
