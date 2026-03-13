import { Icon } from '../../../components/icon';
import { IconButton } from '../../../components/icon-button';
import { PanelSection } from '../../../components/panel-section';
import { LayerSingle } from '../../../components/icon/layer-single';
import { LayersTwo01 } from '../../../components/icon/layers-two-01';
import { useOverlayEditor } from '../../../contexts/overlay-editor-context';
import { usePresentationLayers } from '../../../contexts/presentation-layer-context';
import { useWorkbench } from '../../../contexts/workbench-context';
import { OverlayBinPanel } from '../../resource-drawer/components/overlay-bin-panel';

export function ShowOverlayPanel() {
  const { overlayMode, setOverlayMode } = usePresentationLayers();
  const { createOverlay } = useOverlayEditor();
  const { setWorkbenchMode } = useWorkbench();

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
    <PanelSection
      title={<span className="truncate text-sm font-medium text-text-primary">Overlays</span>}
      action={(
        <div className="flex items-center gap-1">
          <IconButton label={modeLabel} size="sm" variant="ghost" onClick={handleModeToggle}>
            {overlayMode === 'single' ? <LayerSingle size={14} /> : <LayersTwo01 size={14} />}
          </IconButton>

          <IconButton label="Add overlay" size="sm" onClick={handleCreateOverlay}>
            <Icon.plus size={14} strokeWidth={2} />
          </IconButton>
        </div>
      )}
      headerClassName="border-b border-border-primary"
      bodyClassName="min-h-0 overflow-auto p-2"
    >
      <OverlayBinPanel filterText="" />
    </PanelSection>
  );
}
