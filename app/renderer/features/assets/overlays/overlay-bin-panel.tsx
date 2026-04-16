import type { Id, Overlay } from '@core/types';
import { useWorkbench } from '../../../contexts/workbench-context';
import { useOverlayEditor } from '../../../contexts/asset-editor/asset-editor-context';
import { usePresentationLayers } from '../../../contexts/playback/playback-context';
import { useProjectContent } from '../../../contexts/use-project-content';
import { overlayToLayerElements } from '@core/presentation-layers';
import { Thumbnail } from '../../../components/display/thumbnail';
import { SceneFrame } from '../../../components/display/scene-frame';
import { buildRenderScene } from '../../canvas/build-render-scene';
import { SceneStage } from '../../canvas/scene-stage';
import { BinPanelLayout } from '../../workbench/bin-panel-layout';
import { filterByText } from '../../../utils/filter-by-text';

interface OverlayBinPanelProps {
  filterText: string;
  gridItemSize: number;
}

export function OverlayBinPanel({ filterText, gridItemSize }: OverlayBinPanelProps) {
  const { overlays: allOverlays } = useProjectContent();
  const { actions: { setWorkbenchMode } } = useWorkbench();
  const { setCurrentOverlayId } = useOverlayEditor();
  const { activeOverlayIds, activateOverlay } = usePresentationLayers();

  const overlays = filterByText(allOverlays, filterText, (overlay) => [overlay.name, overlay.type]);

  return (
    <BinPanelLayout gridItemSize={gridItemSize} menuState={null} menuItems={[]} onCloseMenu={() => {}}>
      {overlays.map((overlay, index) => (
        <OverlayCard
          key={overlay.id}
          overlay={overlay}
          index={index}
          isActive={activeOverlayIds.includes(overlay.id)}
          onActivate={activateOverlay}
          onEdit={setCurrentOverlayId}
          setWorkbenchMode={setWorkbenchMode}
        />
      ))}
    </BinPanelLayout>
  );
}

interface OverlayCardProps {
  overlay: Overlay;
  index: number;
  isActive: boolean;
  onActivate: (id: Id) => void;
  onEdit: (id: Id) => void;
  setWorkbenchMode: (mode: 'overlay-editor') => void;
}

function OverlayCard({ overlay, index, isActive, onActivate, onEdit, setWorkbenchMode }: OverlayCardProps) {
  const scene = buildRenderScene(null, overlayToLayerElements(overlay));

  function handleActivate() {
    onEdit(overlay.id);
    onActivate(overlay.id);
  }

  function handleEdit() {
    onEdit(overlay.id);
    setWorkbenchMode('overlay-editor');
  }

  return (
    <Thumbnail.Tile onClick={handleActivate} onDoubleClick={handleEdit} selected={isActive}>
      <Thumbnail.Body>
        <SceneFrame width={scene.width} height={scene.height} className="bg-tertiary" stageClassName="absolute inset-0" checkerboard>
          <SceneStage scene={scene} surface="list" className="absolute inset-0 pointer-events-none" />
        </SceneFrame>
      </Thumbnail.Body>
      <Thumbnail.Caption>
        <div className="flex items-center gap-2">
          <span className="shrink-0 text-sm font-semibold tabular-nums text-secondary">{index + 1}</span>
          <span className="min-w-0 truncate text-sm text-tertiary">{overlay.name}</span>
        </div>
      </Thumbnail.Caption>
    </Thumbnail.Tile>
  );
}
