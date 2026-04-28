import { useMemo, type ReactNode } from 'react';
import { useStageEditor } from '../../contexts/asset-editor/asset-editor-context';
import { useInspectorPanelPushAction } from '../../features/canvas/use-inspector-panel-push-action';
import { getEditorHeaderActions } from '../../features/workbench/editor-header-actions';
import { useEditorLeftPanelNav } from '../../features/workbench/use-editor-left-panel-nav';
import { createScreenContext } from '../../contexts/create-screen-context';

interface StageEditorScreenContextValue {
  meta: {
    screenId: 'stage-editor';
    listTitle: 'Stages';
    addActions: ReturnType<typeof getEditorHeaderActions>;
  };
  state: {
    stages: ReturnType<typeof useStageEditor>['stages'];
    currentStageId: ReturnType<typeof useStageEditor>['currentStageId'];
    inspectorState: ReturnType<typeof useInspectorPanelPushAction>['state'];
  };
  actions: {
    selectStage: (id: string | null) => void;
    createStage: () => Promise<void>;
    pushChanges: () => void;
  };
}

const [StageEditorScreenContextProvider, useStageEditorScreen] = createScreenContext<StageEditorScreenContextValue>('StageEditorScreenContext');

export function StageEditorScreenProvider({ children }: { children: ReactNode }) {
  const { stages, currentStageId, setCurrentStageId, createStage } = useStageEditor();
  const { state: inspectorState, handlePushChanges } = useInspectorPanelPushAction();
  const addActions = useMemo(() => getEditorHeaderActions('stage-editor'), []);

  useEditorLeftPanelNav({
    items: stages,
    currentId: currentStageId,
    activate: (id) => setCurrentStageId(id),
  });

  const value = useMemo<StageEditorScreenContextValue>(() => ({
    meta: {
      screenId: 'stage-editor',
      listTitle: 'Stages',
      addActions,
    },
    state: {
      stages,
      currentStageId,
      inspectorState,
    },
    actions: {
      selectStage: setCurrentStageId,
      createStage,
      pushChanges: handlePushChanges,
    },
  }), [addActions, createStage, currentStageId, handlePushChanges, inspectorState, setCurrentStageId, stages]);

  return <StageEditorScreenContextProvider value={value}>{children}</StageEditorScreenContextProvider>;
}

export { useStageEditorScreen };
