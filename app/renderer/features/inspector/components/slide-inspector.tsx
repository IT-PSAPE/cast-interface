import { useEffect, useState } from 'react';
import { Button } from '../../../components/button';
import { FieldInput, LabeledField } from '../../../components/labeled-field';
import { useCast } from '../../../contexts/cast-context';
import { useNavigation } from '../../../contexts/navigation-context';
import { useOverlayEditor } from '../../../contexts/overlay-editor-context';
import { useSlides } from '../../../contexts/slide-context';
import { useWorkbench } from '../../../contexts/workbench-context';
import { useElements } from '../../../contexts/element-context';

export function SlideInspector() {
  const { setStatusText } = useCast();
  const { currentPresentation, setPresentationKind } = useNavigation();
  const { currentSlide } = useSlides();
  const { currentOverlay, updateOverlayDraft } = useOverlayEditor();
  const { workbenchMode } = useWorkbench();
  const { effectiveElements } = useElements();
  const isOverlayEdit = workbenchMode === 'overlay-editor';
  const [overlayNameDraft, setOverlayNameDraft] = useState('');
  const isLyricsPresentation = !isOverlayEdit && currentPresentation?.kind === 'lyrics';

  const canRenameOverlay = Boolean(
    isOverlayEdit &&
    currentOverlay &&
    overlayNameDraft.trim() &&
    overlayNameDraft.trim() !== currentOverlay.name,
  );

  useEffect(() => {
    if (!currentOverlay) {
      setOverlayNameDraft('');
      return;
    }
    setOverlayNameDraft(currentOverlay.name);
  }, [currentOverlay]);

  function handleOverlayNameChange(value: string) {
    setOverlayNameDraft(value);
  }

  function handleRenameOverlay() {
    if (!currentOverlay) return;
    const trimmed = overlayNameDraft.trim();
    if (!trimmed || trimmed === currentOverlay.name) return;
    updateOverlayDraft({ id: currentOverlay.id, name: trimmed });
    setStatusText('Overlay renamed');
  }

  function handleSwitchToCanvas() {
    if (!currentPresentation || currentPresentation.kind === 'canvas') return;
    void setPresentationKind(currentPresentation.id, 'canvas');
  }

  if (!isOverlayEdit && !currentSlide) {
    return <div className="text-[12px] text-text-tertiary">No slide selected.</div>;
  }

  if (isOverlayEdit && !currentOverlay && effectiveElements.length === 0) {
    return <div className="text-[12px] text-text-tertiary">No overlay selected.</div>;
  }

  return (
    <div className="grid gap-3">
      {isOverlayEdit && currentOverlay ? (
        <div className="grid gap-1.5">
          <LabeledField label="Overlay Name" wide>
            <FieldInput type="text" value={overlayNameDraft} onChange={handleOverlayNameChange} />
          </LabeledField>
          <Button onClick={handleRenameOverlay} disabled={!canRenameOverlay} className="w-fit">
            Rename
          </Button>
        </div>
      ) : null}

      <div className="flex gap-4">
        {!isOverlayEdit && currentSlide ? (
          <>
            <div>
              <span className="text-[11px] text-text-tertiary uppercase tracking-wider">Width</span>
              <p className="text-[14px] text-text-primary m-0 mt-0.5">{currentSlide.width}</p>
            </div>
            <div>
              <span className="text-[11px] text-text-tertiary uppercase tracking-wider">Height</span>
              <p className="text-[14px] text-text-primary m-0 mt-0.5">{currentSlide.height}</p>
            </div>
          </>
        ) : null}
        <div>
          <span className="text-[11px] text-text-tertiary uppercase tracking-wider">{isOverlayEdit ? 'Objects' : 'Elements'}</span>
          <p className="text-[14px] text-text-primary m-0 mt-0.5">{effectiveElements.length}</p>
        </div>
      </div>

      <div>
        <span className="text-[11px] text-text-tertiary uppercase tracking-wider">Output</span>
        <p className="text-[12px] text-text-secondary m-0 mt-0.5">1920 × 1080 RGBA</p>
      </div>

      {isLyricsPresentation ? (
        <div className="grid gap-2 rounded-md border border-border-primary bg-background-tertiary/60 p-2">
          <p className="m-0 text-[12px] text-text-secondary">
            Lyrics presentations support one text element per slide. Shapes and media are disabled until you switch this presentation to Canvas.
          </p>
          <Button onClick={handleSwitchToCanvas} className="w-fit">
            Switch To Canvas
          </Button>
        </div>
      ) : null}

    </div>
  );
}
