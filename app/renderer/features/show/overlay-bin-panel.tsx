import { useWorkbench } from '../../contexts/workbench-context';
import { useOverlayEditor } from '../../contexts/overlay-editor/overlay-editor-context';
import { usePresentationLayers } from '../../contexts/presentation-layer-context';
import { useProjectContent } from '../../contexts/use-project-content';
import { overlayToLayerElements } from '@core/presentation-layers';
import { buildRenderScene } from '../stage/build-render-scene';
import { SceneThumbnailCard } from '../../components/display/scene-thumbnail-card';
import { ThumbnailGrid } from '../../components/layout/thumbnail-grid';
import { filterByText } from '../../utils/filter-by-text';
import type { Id, Overlay } from '@core/types';

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
    <ThumbnailGrid columns={gridItemSize}>
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
    </ThumbnailGrid>
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
