import { isLyricDeckItem } from '@core/deck-items';
import { Globe, Image, PencilLine, Square, Type } from 'lucide-react';
import { ReacstButton } from '@renderer/components 2.0/button';
import { MediaPickerDialog } from '../../components/overlays/media-picker-dialog';
import { useCast } from '../../contexts/app-context';
import { useElements } from '../../contexts/canvas/canvas-context';
import { useNavigation } from '../../contexts/navigation-context';
import { useTemplateEditor } from '../../contexts/asset-editor/asset-editor-context';
import { useWorkbench } from '../../contexts/workbench-context';
import { useStagePanelController } from './use-stage-panel-controller';
import { StageViewport } from './stage-viewport';
import { EmptyState } from '../../components/display/empty-state';

function formatMetric(value: number | null): string {
  if (value === null) return '--';
  return `${Math.round(value)}`;
}

export function StagePanel() {
  const { actions, state } = useStagePanelController();
  const { x, y, width, height } = state.selectionMetrics;
  const { createText, createShape } = useElements();
  const { setStatusText } = useCast();
  const { currentDeckItem } = useNavigation();
  const { currentTemplate } = useTemplateEditor();
  const { state: { workbenchMode } } = useWorkbench();
  const hideAddText = workbenchMode === 'deck-editor'
    ? isLyricDeckItem(currentDeckItem)
    : workbenchMode === 'template-editor'
      ? currentTemplate?.kind === 'lyrics'
      : false;

  function handleAddMedia() {
    if (actions.openMediaPicker) {
      actions.openMediaPicker();
    }
  }

  function handleUnavailable() {
    setStatusText('This element type is not yet available.');
  }

  return (
    <section
      data-ui-region="stage-panel"
      className="grid h-full min-h-0 grid-rows-[1fr_auto] overflow-hidden bg-primary/50"
    >
      <div className="relative min-h-0 overflow-hidden p-2">
        {state.hasCanvasSource ? (
          <>
            <StageViewport />
            <div className="pointer-events-none absolute inset-x-0 top-4 flex justify-center">
              <div className="pointer-events-auto flex items-center gap-0.5 rounded-lg border border-primary bg-tertiary/90 px-1 py-0.5 shadow-2xl backdrop-blur-sm">
                {!hideAddText ? (
                  <ReacstButton.Icon label="Add Text" onClick={createText}>
                    <Type size={18} strokeWidth={1.5} />
                  </ReacstButton.Icon>
                ) : null}
                <ReacstButton.Icon label="Add Shape" onClick={createShape}>
                  <Square size={18} strokeWidth={1.5} />
                </ReacstButton.Icon>
                <ReacstButton.Icon label="Add Media" onClick={handleAddMedia}>
                  <Image size={18} strokeWidth={1.5} />
                </ReacstButton.Icon>
                <ReacstButton.Icon label="Draw Path" onClick={handleUnavailable} disabled>
                  <PencilLine size={18} strokeWidth={1.5} />
                </ReacstButton.Icon>
                <ReacstButton.Icon label="Add Web Source" onClick={handleUnavailable} disabled>
                  <Globe size={18} strokeWidth={1.5} />
                </ReacstButton.Icon>
              </div>
            </div>
            {state.showMediaPicker ? (
              <MediaPickerDialog
                assets={state.mediaAssets}
                onConfirm={actions.confirmMedia}
                onClose={actions.closeMediaPicker}
              />
            ) : null}
          </>
        ) : (
          <EmptyState.Root>
            <EmptyState.Title>{state.emptyStateLabel}</EmptyState.Title>
          </EmptyState.Root>
        )}
      </div>

      <footer className="flex items-center gap-4 border-t border-primary bg-primary/80 px-3 py-1 text-sm text-secondary">
        <span className="font-medium text-tertiary">Selection</span>
        <span>X: {formatMetric(x)}</span>
        <span>Y: {formatMetric(y)}</span>
        <span>W: {formatMetric(width)}</span>
        <span>H: {formatMetric(height)}</span>
      </footer>
    </section>
  );
}
