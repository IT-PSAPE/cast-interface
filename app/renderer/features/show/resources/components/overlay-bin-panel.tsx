import { useWorkbench } from '../../../../contexts/workbench-context';
import { useOverlayEditor } from '../../../../contexts/overlay-editor/overlay-editor-context';
import { usePresentationLayers } from '../../../../contexts/presentation-layer-context';
import { useProjectContent } from '../../../../contexts/use-project-content';
import { overlayToLayerElements } from '@core/presentation-layers';
import { buildRenderScene } from '../../../stage/rendering/build-render-scene';
import { SceneThumbnailCard } from '../../../../components/display/scene-thumbnail-card';

interface OverlayBinPanelProps {
  filterText: string;
}

export function OverlayBinPanel({ filterText }: OverlayBinPanelProps) {
  const { overlays: allOverlays } = useProjectContent();
  const { actions: { setWorkbenchMode } } = useWorkbench();
  const { setCurrentOverlayId } = useOverlayEditor();
  const { activeOverlayIds, activateOverlay } = usePresentationLayers();

  const normalizedFilter = filterText.trim().toLowerCase();
  const overlays = allOverlays.filter((overlay) => {
    if (!normalizedFilter) return true;
    return overlay.name.toLowerCase().includes(normalizedFilter) || overlay.type.toLowerCase().includes(normalizedFilter);
  });

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3">
      {overlays.map((overlay, index) => {
        function handleActivateOverlay() {
          setCurrentOverlayId(overlay.id);
          activateOverlay(overlay.id);
        }
        function handleEditOverlay() {
          setCurrentOverlayId(overlay.id);
          setWorkbenchMode('overlay-editor');
        }
        const scene = buildRenderScene(null, overlayToLayerElements(overlay));
        return (
          <SceneThumbnailCard
            key={overlay.id}
            scene={scene}
            index={index}
            label={overlay.name}
            secondaryText={overlay.name}
            onClick={handleActivateOverlay}
            onDoubleClick={handleEditOverlay}
            selected={activeOverlayIds.includes(overlay.id)}
          />
        );
      })}
    </div>
  );
}
