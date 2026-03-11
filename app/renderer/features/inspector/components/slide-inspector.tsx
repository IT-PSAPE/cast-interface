import { useEffect, useState } from 'react';
import { Button } from '../../../components/button';
import { FieldInput } from '../../../components/labeled-field';
import { useCast } from '../../../contexts/cast-context';
import { useOverlayEditor } from '../../../contexts/overlay-editor-context';
import { useWorkbench } from '../../../contexts/workbench-context';
import { useElements } from '../../../contexts/element-context';

export function SlideInspector() {
  const { setStatusText } = useCast();
  const { currentOverlay, updateOverlayDraft } = useOverlayEditor();
  const { workbenchMode } = useWorkbench();
  const { effectiveElements } = useElements();
  const isOverlayEdit = workbenchMode === 'overlay-editor';
  const [overlayNameDraft, setOverlayNameDraft] = useState('');

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

  if (isOverlayEdit && !currentOverlay && effectiveElements.length === 0) {
    return <div className="text-[12px] text-text-tertiary">No overlay selected.</div>;
  }

  return (
    <div className="grid gap-3">
      {isOverlayEdit && currentOverlay ? (
        <div className="grid gap-1.5">
          <FieldInput type="text" value={overlayNameDraft} onChange={handleOverlayNameChange} />
          <Button onClick={handleRenameOverlay} disabled={!canRenameOverlay} className="w-fit">
            Rename
          </Button>
        </div>
      ) : null}
    </div>
  );
}
