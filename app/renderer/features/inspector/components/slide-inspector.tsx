import { ActionButton } from '../../../components/action-button';
import { useCast } from '../../../contexts/cast-context';
import { useSlides } from '../../../contexts/slide-context';
import { useElements } from '../../../contexts/element-context';

export function SlideInspector() {
  const { setStatusText } = useCast();
  const { currentSlide } = useSlides();
  const { effectiveElements, createText, createShape } = useElements();

  function handleAddText() {
    void createText();
  }

  function handleAddShape() {
    void createShape();
  }

  function handleMediaDropHint() {
    setStatusText('Drag media from the drawer onto the slide canvas.');
  }

  if (!currentSlide) {
    return <div className="text-[12px] text-text-muted">No slide selected.</div>;
  }

  return (
    <div className="grid gap-3">
      <div className="flex gap-4">
        <div>
          <span className="text-[11px] text-text-muted uppercase tracking-wider">Width</span>
          <p className="text-[14px] text-text-primary m-0 mt-0.5">{currentSlide.width}</p>
        </div>
        <div>
          <span className="text-[11px] text-text-muted uppercase tracking-wider">Height</span>
          <p className="text-[14px] text-text-primary m-0 mt-0.5">{currentSlide.height}</p>
        </div>
        <div>
          <span className="text-[11px] text-text-muted uppercase tracking-wider">Elements</span>
          <p className="text-[14px] text-text-primary m-0 mt-0.5">{effectiveElements.length}</p>
        </div>
      </div>

      <div>
        <span className="text-[11px] text-text-muted uppercase tracking-wider">Output</span>
        <p className="text-[12px] text-text-secondary m-0 mt-0.5">1920 × 1080 RGBA</p>
      </div>

      <div>
        <span className="text-[11px] text-text-muted uppercase tracking-wider">Slide Actions</span>
        <div className="mt-1.5 flex flex-wrap gap-2">
          <ActionButton onClick={handleAddText}>Add Text</ActionButton>
          <ActionButton onClick={handleAddShape}>Add Shape</ActionButton>
          <ActionButton onClick={handleMediaDropHint}>Media Drop</ActionButton>
        </div>
      </div>
    </div>
  );
}
