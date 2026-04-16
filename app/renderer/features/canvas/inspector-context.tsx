import { useWorkbench } from '../../contexts/workbench-context';

interface InspectorContextValue {
  inspectorTab: ReturnType<typeof useWorkbench>['state']['inspectorTab'];
  setInspectorTab: (tab: ReturnType<typeof useWorkbench>['state']['inspectorTab']) => void;
}

export function useInspector(): InspectorContextValue {
  const {
    state: { inspectorTab },
    actions: { setInspectorTab },
  } = useWorkbench();

  return {
    inspectorTab,
    setInspectorTab,
  };
}
