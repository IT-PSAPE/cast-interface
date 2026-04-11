import type { Id, Overlay } from '@core/types';
import { useWorkbench } from '../../contexts/workbench-context';
import { useOverlayEditor } from '../../contexts/overlay-editor/overlay-editor-context';
import { usePresentationLayers } from '../../contexts/presentation-layer-context';
import { useProjectContent } from '../../contexts/use-project-content';
import { overlayToLayerElements } from '@core/presentation-layers';
import { buildRenderScene } from '../stage/build-render-scene';
import { SceneThumbnailCard } from '../../components/display/scene-thumbnail-card';
import { BinPanelLayout } from './bin-panel-layout';
import { filterByText } from '../../utils/filter-by-text';

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
    <SceneThumbnailCard
      scene={scene}
      index={index}
      label={overlay.name}
      secondaryText={overlay.name}
      onClick={handleActivate}
      onDoubleClick={handleEdit}
      selected={isActive}
    />
  );
}
