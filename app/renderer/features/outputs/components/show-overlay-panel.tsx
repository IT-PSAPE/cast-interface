import { Button } from '../../../components/button';
import { Icon } from '../../../components/icon';
import { PanelSection } from '../../../components/panel-section';
import {
  SegmentedControl,
  SegmentedControlItem,
  SegmentedControlItemLabel,
} from '../../../components/segmented-control';
import { useOverlayEditor } from '../../../contexts/overlay-editor-context';
import { usePresentationLayers } from '../../../contexts/presentation-layer-context';
import { useWorkbench } from '../../../contexts/workbench-context';
import { OverlayBinPanel } from '../../resource-drawer/components/overlay-bin-panel';

export function ShowOverlayPanel() {
  const { overlayMode, setOverlayMode } = usePresentationLayers();
  const { createOverlay } = useOverlayEditor();
  const { setWorkbenchMode } = useWorkbench();

  function handleModeChange(value: string | string[]) {
    if (Array.isArray(value)) return;
    if (value !== 'single' && value !== 'multiple') return;
    setOverlayMode(value);
  }

  function handleCreateOverlay() {
    void createOverlay().then(() => {
      setWorkbenchMode('overlay-editor');
    });
  }

  return (
    <PanelSection
      title={<span className="truncate text-[12px] font-medium text-text-primary">Overlays</span>}
      action={(
        <div className="flex items-center gap-2">
          <SegmentedControl label="Overlay mode" value={overlayMode} onValueChange={handleModeChange}>
            <SegmentedControlItem value="single" title="Show one overlay at a time">
              <SegmentedControlItemLabel>Single</SegmentedControlItemLabel>
            </SegmentedControlItem>
            <SegmentedControlItem value="multiple" title="Allow multiple overlays at once">
              <SegmentedControlItemLabel>Multiple</SegmentedControlItemLabel>
            </SegmentedControlItem>
          </SegmentedControl>

          <Button onClick={handleCreateOverlay} className="grid h-6 w-6 place-items-center p-0 text-[14px] leading-none">
            <Icon.plus size={14} strokeWidth={2} />
            <span className="sr-only">Add overlay</span>
          </Button>
        </div>
      )}
      className="border-t border-border-primary"
      headerClassName="border-b border-border-primary"
      bodyClassName="min-h-0 overflow-auto p-2"
    >
      <OverlayBinPanel filterText="" />
    </PanelSection>
  );
}
