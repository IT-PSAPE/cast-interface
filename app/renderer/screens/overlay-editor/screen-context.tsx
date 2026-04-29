import { useMemo, type ReactNode } from 'react';
import { useOverlayEditor } from '../../contexts/asset-editor/asset-editor-context';
import { useInspectorPanelPushAction } from '../../features/canvas/use-inspector-panel-push-action';
import { getEditorHeaderActions } from '../../features/workbench/editor-header-actions';
import { useEditorLeftPanelNav } from '../../features/workbench/use-editor-left-panel-nav';
import { createScreenContext } from '../../contexts/create-screen-context';

interface OverlayEditorScreenContextValue {
  meta: {
    screenId: 'overlay-editor';
    listTitle: 'Overlays';
    addActions: ReturnType<typeof getEditorHeaderActions>;
  };
  state: {
    overlays: ReturnType<typeof useOverlayEditor>['overlays'];
    currentOverlayId: ReturnType<typeof useOverlayEditor>['currentOverlayId'];
    inspectorState: ReturnType<typeof useInspectorPanelPushAction>['state'];
  };
  actions: {
    selectOverlay: (id: string | null) => void;
    createOverlay: () => Promise<void>;
    pushChanges: () => void;
  };
}

const [OverlayEditorScreenContextProvider, useOverlayEditorScreen] = createScreenContext<OverlayEditorScreenContextValue>('OverlayEditorScreenContext');

export function OverlayEditorScreenProvider({ children }: { children: ReactNode }) {
  const { overlays, currentOverlayId, setCurrentOverlayId, createOverlay } = useOverlayEditor();
  const { state: inspectorState, handlePushChanges } = useInspectorPanelPushAction();
  const addActions = useMemo(() => getEditorHeaderActions('overlay-editor'), []);

  useEditorLeftPanelNav({
    items: overlays,
    currentId: currentOverlayId,
    activate: (id) => setCurrentOverlayId(id),
  });

  const value = useMemo<OverlayEditorScreenContextValue>(() => ({
    meta: {
      screenId: 'overlay-editor',
      listTitle: 'Overlays',
      addActions,
    },
    state: {
      overlays,
      currentOverlayId,
      inspectorState,
    },
    actions: {
      selectOverlay: setCurrentOverlayId,
      createOverlay,
      pushChanges: handlePushChanges,
    },
  }), [addActions, createOverlay, currentOverlayId, handlePushChanges, inspectorState, overlays, setCurrentOverlayId]);

  return <OverlayEditorScreenContextProvider value={value}>{children}</OverlayEditorScreenContextProvider>;
}

export { useOverlayEditorScreen };
