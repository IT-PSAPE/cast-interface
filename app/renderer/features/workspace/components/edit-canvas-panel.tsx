import { useElements } from '../../../contexts/element-context';
import { useSlides } from '../../../contexts/slide-context';
import { CanvasStage } from './canvas-stage';

function formatMetric(value: number | null): string {
  if (value === null) return '--';
  return `${Math.round(value)}`;
}

export function EditCanvasPanel() {
  const { currentSlide } = useSlides();
  const { selectedElement, elementDraft } = useElements();

  const x = elementDraft?.x ?? selectedElement?.x ?? null;
  const y = elementDraft?.y ?? selectedElement?.y ?? null;
  const width = elementDraft?.width ?? selectedElement?.width ?? null;
  const height = elementDraft?.height ?? selectedElement?.height ?? null;

  return (
    <section className="grid h-full min-h-0 grid-rows-[1fr_auto] overflow-hidden bg-surface-0/50">
      <div className="min-h-0 overflow-hidden p-2">
        {currentSlide ? (
          <CanvasStage />
        ) : (
          <div className="grid h-full min-h-0 place-items-center rounded-md border border-stroke bg-surface-0 text-[12px] text-text-muted">
            No slide selected.
          </div>
        )}
      </div>

      <footer className="flex items-center gap-4 border-t border-stroke bg-surface-1/80 px-3 py-1 text-[11px] text-text-secondary">
        <span className="font-medium text-text-muted">Selection</span>
        <span>X: {formatMetric(x)}</span>
        <span>Y: {formatMetric(y)}</span>
        <span>W: {formatMetric(width)}</span>
        <span>H: {formatMetric(height)}</span>
      </footer>
    </section>
  );
}
