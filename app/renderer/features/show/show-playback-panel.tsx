import { useState } from 'react';
import { Tabs } from '../../components/display/tabs';
import { GridSizeSlider } from '../../components/form/grid-size-slider';
import { useGridSize } from '../../hooks/use-grid-size';
import { ShowAudioPanel } from './show-audio-panel';
import { OverlayBinPanel } from './overlay-bin-panel';
import { ShowOverlayPanelActions } from './show-overlay-panel-actions';

type PreviewPanelTab = 'overlays' | 'audio';

export function ShowPlaybackPanel() {
  const [activeTab, setActiveTab] = useState<PreviewPanelTab>('overlays');
  const { gridSize, setGridSize, min, max } = useGridSize('lumora.grid-size.overlay-bin', 140, 100, 280);

  function handleTabChange(value: string) {
    setActiveTab(value as PreviewPanelTab);
  }

  const actions = activeTab === 'overlays' ? <ShowOverlayPanelActions /> : null;

  return (
    <Tabs.Root value={activeTab} onValueChange={handleTabChange}>
      <section className="flex h-full min-h-0 flex-col overflow-hidden">
        <div className="border-b border-primary px-2">
          <Tabs.List label="Show playback tabs" actions={actions}>
            <Tabs.Trigger value="overlays">Overlays</Tabs.Trigger>
            <Tabs.Trigger value="audio">Audio</Tabs.Trigger>
          </Tabs.List>
        </div>
        <Tabs.Panel value="overlays">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="min-h-0 flex-1 overflow-auto p-2">
              <OverlayBinPanel filterText="" gridItemSize={gridSize} />
            </div>
            <div className="flex items-center justify-end border-t border-primary px-2 py-1">
              <GridSizeSlider value={gridSize} min={min} max={max} onChange={setGridSize} />
            </div>
          </div>
        </Tabs.Panel>
        <Tabs.Panel value="audio"><ShowAudioPanel /></Tabs.Panel>
      </section>
    </Tabs.Root>
  );
}
