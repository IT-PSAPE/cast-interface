import { useCallback, useMemo, useState } from 'react';
import type { MediaAsset } from '@core/types';
import { useElements } from '../../contexts/canvas/canvas-context';
import { useActiveEditorSource } from '../../contexts/canvas/use-active-editor-source';
import { useProjectContent } from '../../contexts/use-project-content';

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
  const activeEditorSource = useActiveEditorSource();
  const { selectedElement, elementDraft, createFromMedia } = useElements();
  const { mediaAssets } = useProjectContent();
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  const state = useMemo<StagePanelControllerState>(() => {
    return {
      emptyStateLabel: activeEditorSource.emptyStateLabel,
      hasCanvasSource: activeEditorSource.editable && activeEditorSource.hasSource,
      mediaAssets,
      selectionMetrics: {
        x: elementDraft?.x ?? selectedElement?.x ?? null,
        y: elementDraft?.y ?? selectedElement?.y ?? null,
        width: elementDraft?.width ?? selectedElement?.width ?? null,
        height: elementDraft?.height ?? selectedElement?.height ?? null
      },
      showMediaPicker
    };
  }, [activeEditorSource, elementDraft, mediaAssets, selectedElement, showMediaPicker]);

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
