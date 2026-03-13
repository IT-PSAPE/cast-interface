import { useCallback, useMemo, useState } from 'react';
import type { MediaAsset } from '@core/types';
import { useElements } from '../../../contexts/element-context';
import { useOverlayEditor } from '../../../contexts/overlay-editor-context';
import { useSlides } from '../../../contexts/slide-context';
import { useTemplateEditor } from '../../../contexts/template-editor-context';
import { useProjectContent } from '../../../contexts/use-project-content';
import { useWorkbench } from '../../../contexts/workbench-context';

interface SelectionMetrics {
  x: number | null;
  y: number | null;
  width: number | null;
  height: number | null;
}

interface StagePanelControllerState {
  emptyStateLabel: string;
  hasCanvasSource: boolean;
  mediaAssets: MediaAsset[];
  selectionMetrics: SelectionMetrics;
  showMediaPicker: boolean;
}

interface StagePanelControllerActions {
  closeMediaPicker: () => void;
  confirmMedia: (selected: MediaAsset[]) => void;
  openMediaPicker: () => void;
}

interface StagePanelController {
  actions: StagePanelControllerActions;
  state: StagePanelControllerState;
}

export function useStagePanelController(): StagePanelController {
  const { currentSlide } = useSlides();
  const { currentOverlay } = useOverlayEditor();
  const { currentTemplate } = useTemplateEditor();
  const { selectedElement, elementDraft, createFromMedia } = useElements();
  const { workbenchMode } = useWorkbench();
  const { mediaAssets } = useProjectContent();
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  const state = useMemo<StagePanelControllerState>(() => {
    const isOverlayEdit = workbenchMode === 'overlay-editor';
    const isTemplateEdit = workbenchMode === 'template-editor';

    return {
      emptyStateLabel: isOverlayEdit ? 'No overlay selected.' : isTemplateEdit ? 'No template selected.' : 'No slide selected.',
      hasCanvasSource: isOverlayEdit ? Boolean(currentOverlay) : isTemplateEdit ? Boolean(currentTemplate) : Boolean(currentSlide),
      mediaAssets,
      selectionMetrics: {
        x: elementDraft?.x ?? selectedElement?.x ?? null,
        y: elementDraft?.y ?? selectedElement?.y ?? null,
        width: elementDraft?.width ?? selectedElement?.width ?? null,
        height: elementDraft?.height ?? selectedElement?.height ?? null
      },
      showMediaPicker
    };
  }, [currentOverlay, currentSlide, currentTemplate, elementDraft, mediaAssets, selectedElement, showMediaPicker, workbenchMode]);

  const openMediaPicker = useCallback(() => {
    setShowMediaPicker(true);
  }, []);

  const closeMediaPicker = useCallback(() => {
    setShowMediaPicker(false);
  }, []);

  const confirmMedia = useCallback((selected: MediaAsset[]) => {
    setShowMediaPicker(false);
    const startX = 200;
    const startY = 200;
    const offset = 40;

    for (let index = 0; index < selected.length; index += 1) {
      void createFromMedia(selected[index], startX + index * offset, startY + index * offset);
    }
  }, [createFromMedia]);

  return {
    actions: {
      closeMediaPicker,
      confirmMedia,
      openMediaPicker
    },
    state
  };
}
