import { MediaPickerDialog } from '../../../components/media-picker-dialog';
import { useStagePanelController } from '../hooks/use-stage-panel-controller';
import { StageViewport } from '../../stage/components/stage-viewport';
import { StageToolbar } from './stage-toolbar';

function formatMetric(value: number | null): string {
  if (value === null) return '--';
  return `${Math.round(value)}`;
}

export function StagePanel() {
  const { actions, state } = useStagePanelController();
  const { x, y, width, height } = state.selectionMetrics;

  return (
    <section
      data-ui-region="stage-panel"
      className="grid h-full min-h-0 grid-rows-[1fr_auto] overflow-hidden bg-background-primary/50"
    >
      <div className="relative min-h-0 overflow-hidden p-2">
        {state.hasCanvasSource ? (
          <>
            <StageViewport />
            <div className="pointer-events-none absolute inset-x-0 top-4 flex justify-center">
              <StageToolbar onOpenMediaPicker={actions.openMediaPicker} />
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
          <div className="grid h-full min-h-0 place-items-center rounded-md border border-border-primary bg-background-primary text-sm text-text-tertiary">
            {state.emptyStateLabel}
          </div>
        )}
      </div>

      <footer className="flex items-center gap-4 border-t border-border-primary bg-primary/80 px-3 py-1 text-sm text-text-secondary">
        <span className="font-medium text-text-tertiary">Selection</span>
        <span>X: {formatMetric(x)}</span>
        <span>Y: {formatMetric(y)}</span>
        <span>W: {formatMetric(width)}</span>
        <span>H: {formatMetric(height)}</span>
      </footer>
    </section>
  );
}
