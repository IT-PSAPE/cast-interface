import { Panel } from '../../components/layout/panel';
import { GridSizeSlider } from '../../components/form/grid-size-slider';
import { useGridSize } from '../../hooks/use-grid-size';
import { OverlayBinPanel } from './overlay-bin-panel';
import { ShowOverlayPanelActions } from './show-overlay-panel-actions';

export function ShowPlaybackPanel() {
  const { gridSize, setGridSize, min, max } = useGridSize('recast.grid-size.overlay-bin', 3, 2, 4);

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden">
      <Panel.Header>
        <span className="text-sm font-medium text-primary mr-auto">Overlays</span>
        <ShowOverlayPanelActions />
      </Panel.Header>
      <div className="min-h-0 flex-1 overflow-auto p-2">
        <OverlayBinPanel filterText="" gridItemSize={gridSize} />
      </div>
      <div className="flex items-center justify-end border-t border-primary px-2 py-1">
        <GridSizeSlider value={gridSize} min={min} max={max} onChange={setGridSize} />
      </div>
    </section>
  );
}
