import { useWorkbench } from '../../contexts/workbench-context';

interface ResourceDrawerContextValue {
  drawerTab: ReturnType<typeof useWorkbench>['state']['drawerTab'];
  drawerViewMode: ReturnType<typeof useWorkbench>['state']['drawerViewMode'];
  setDrawerTab: (tab: ReturnType<typeof useWorkbench>['state']['drawerTab']) => void;
  setDrawerViewMode: (mode: ReturnType<typeof useWorkbench>['state']['drawerViewMode']) => void;
}

export function useResourceDrawer(): ResourceDrawerContextValue {
  const {
    state: {
      drawerTab,
      drawerViewMode,
    },
    actions: {
      setDrawerTab,
      setDrawerViewMode,
    },
  } = useWorkbench();

  return {
    drawerTab,
    drawerViewMode,
    setDrawerTab,
    setDrawerViewMode,
  };
}
