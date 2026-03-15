import { useCallback, useMemo } from 'react';
import { useOverlayEditor } from '../../../contexts/overlay-editor-context';
import { useSlideEditor } from '../../../contexts/slide-editor-context';
import { useTemplateEditor } from '../../../contexts/template-editor-context';
import { useWorkbench } from '../../../contexts/workbench-context';
import { useRenderScenes } from '../../stage/rendering/render-scene-provider';

interface InspectorPanelPushActionState {
  isVisible: boolean;
  hasPendingChanges: boolean;
  isPushingChanges: boolean;
  pushLabel: string;
}

interface InspectorPanelPushAction {
  state: InspectorPanelPushActionState;
  handlePushChanges: () => Promise<void>;
}

export function useInspectorPanelPushAction(): InspectorPanelPushAction {
  const { workbenchMode } = useWorkbench();
  const overlayEditor = useOverlayEditor();
  const slideEditor = useSlideEditor();
  const templateEditor = useTemplateEditor();
  const { commitProgramScene } = useRenderScenes();

  const state = useMemo<InspectorPanelPushActionState>(() => {
    if (workbenchMode === 'overlay-editor') {
      return {
        isVisible: overlayEditor.hasPendingChanges,
        hasPendingChanges: overlayEditor.hasPendingChanges,
        isPushingChanges: overlayEditor.isPushingChanges,
        pushLabel: 'Push Overlay'
      };
    }

    if (workbenchMode === 'slide-editor') {
      return {
        isVisible: slideEditor.hasPendingChanges,
        hasPendingChanges: slideEditor.hasPendingChanges,
        isPushingChanges: slideEditor.isPushingChanges,
        pushLabel: 'Push Slide'
      };
    }

    if (workbenchMode === 'template-editor') {
      return {
        isVisible: templateEditor.hasPendingChanges,
        hasPendingChanges: templateEditor.hasPendingChanges,
        isPushingChanges: templateEditor.isPushingChanges,
        pushLabel: 'Push Template'
      };
    }

    return {
      isVisible: false,
      hasPendingChanges: false,
      isPushingChanges: false,
      pushLabel: 'Push Slide'
    };
  }, [overlayEditor.hasPendingChanges, overlayEditor.isPushingChanges, slideEditor.hasPendingChanges, slideEditor.isPushingChanges, templateEditor.hasPendingChanges, templateEditor.isPushingChanges, workbenchMode]);

  const handlePushChanges = useCallback(async () => {
    if (!state.hasPendingChanges) return;

    if (workbenchMode === 'overlay-editor') {
      await overlayEditor.pushChanges();
    } else if (workbenchMode === 'slide-editor') {
      await slideEditor.pushChanges();
    } else if (workbenchMode === 'template-editor') {
      await templateEditor.pushChanges();
    } else {
      return;
    }

    commitProgramScene();
  }, [commitProgramScene, overlayEditor, slideEditor, state.hasPendingChanges, templateEditor, workbenchMode]);

  return {
    state,
    handlePushChanges
  };
}
