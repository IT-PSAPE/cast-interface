import { useCallback, useState } from 'react';
import type { MediaAsset } from '@core/types';
import { MediaPickerDialog } from '../../../components/media-picker-dialog';
import { useElements } from '../../../contexts/element-context';
import { useOverlayEditor } from '../../../contexts/overlay-editor-context';
import { useSlides } from '../../../contexts/slide-context';
import { useProjectContent } from '../../../contexts/use-project-content';
import { useWorkbench } from '../../../contexts/workbench-context';
import { StageViewport } from '../../stage/components/stage-viewport';
import { StageToolbar } from './stage-toolbar';

function formatMetric(value: number | null): string {
  if (value === null) return '--';
  return `${Math.round(value)}`;
}

export function StagePanel() {
  const { currentSlide } = useSlides();
  const { currentOverlay } = useOverlayEditor();
  const { selectedElement, elementDraft, createFromMedia } = useElements();
  const { workbenchMode } = useWorkbench();
  const { mediaAssets } = useProjectContent();
  const isOverlayEdit = workbenchMode === 'overlay-editor';
  const hasCanvasSource = isOverlayEdit ? Boolean(currentOverlay) : Boolean(currentSlide);
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  const x = elementDraft?.x ?? selectedElement?.x ?? null;
  const y = elementDraft?.y ?? selectedElement?.y ?? null;
  const width = elementDraft?.width ?? selectedElement?.width ?? null;
  const height = elementDraft?.height ?? selectedElement?.height ?? null;

  function handleOpenMediaPicker() {
    setShowMediaPicker(true);
  }

  function handleCloseMediaPicker() {
    setShowMediaPicker(false);
  }

  const handleConfirmMedia = useCallback((selected: MediaAsset[]) => {
    setShowMediaPicker(false);
    const startX = 200;
    const startY = 200;
    const offset = 40;
    for (let i = 0; i < selected.length; i++) {
      void createFromMedia(selected[i], startX + i * offset, startY + i * offset);
    }
  }, [createFromMedia]);

  return (
    <section className="grid h-full min-h-0 grid-rows-[1fr_auto] overflow-hidden bg-background-primary/50">
      <div className="relative min-h-0 overflow-hidden p-2">
        {hasCanvasSource ? (
          <>
            <StageViewport />
            <div className="pointer-events-none absolute inset-x-0 top-4 flex justify-center">
              <StageToolbar onOpenMediaPicker={handleOpenMediaPicker} />
            </div>
            {showMediaPicker ? (
              <MediaPickerDialog
                assets={mediaAssets}
                onConfirm={handleConfirmMedia}
                onClose={handleCloseMediaPicker}
              />
            ) : null}
          </>
        ) : (
          <div className="grid h-full min-h-0 place-items-center rounded-md border border-border-primary bg-background-primary text-[12px] text-text-tertiary">
            {isOverlayEdit ? 'No overlay selected.' : 'No slide selected.'}
          </div>
        )}
      </div>

      <footer className="flex items-center gap-4 border-t border-border-primary bg-background-primary_alt/80 px-3 py-1 text-[11px] text-text-secondary">
        <span className="font-medium text-text-tertiary">Selection</span>
        <span>X: {formatMetric(x)}</span>
        <span>Y: {formatMetric(y)}</span>
        <span>W: {formatMetric(width)}</span>
        <span>H: {formatMetric(height)}</span>
      </footer>
    </section>
  );
}
