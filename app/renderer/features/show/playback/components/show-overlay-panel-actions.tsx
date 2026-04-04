import { Layers, Layers2, Plus } from 'lucide-react';
import { Button } from '../../../../components/controls/button';
import { useOverlayEditor } from '../../../../contexts/overlay-editor/overlay-editor-context';
import { usePresentationLayers } from '../../../../contexts/presentation-layer-context';
import { useWorkbench } from '../../../../contexts/workbench-context';

export function ShowOverlayPanelActions() {
  const { overlayMode, setOverlayMode } = usePresentationLayers();
  const { createOverlay } = useOverlayEditor();
  const { actions: { setWorkbenchMode } } = useWorkbench();

  function handleModeToggle() {
    setOverlayMode(overlayMode === 'single' ? 'multiple' : 'single');
  }

  function handleCreateOverlay() {
    void createOverlay().then(() => {
      setWorkbenchMode('overlay-editor');
    });
  }

  const modeLabel = overlayMode === 'single' ? 'Single overlay mode — click to allow multiple' : 'Multiple overlay mode — click for single';

  return (
    <>
      <Button label={modeLabel} size="icon-sm" variant="ghost" onClick={handleModeToggle}>
        {overlayMode === 'single' ? <Layers size={14} /> : <Layers2 size={14} />}
      </Button>
      <Button label="Add overlay" size="icon-sm" onClick={handleCreateOverlay}>
        <Plus size={14} strokeWidth={2} />
      </Button>
    </>
  );
}
