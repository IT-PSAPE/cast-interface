import { ThumbnailTile } from '../../../components/thumbnail-tile';
import { useWorkbench } from '../../../contexts/workbench-context';
import { useOverlayEditor } from '../../../contexts/overlay-editor-context';
import { usePresentationLayers } from '../../../contexts/presentation-layer-context';
import { useProjectContent } from '../../../contexts/use-project-content';

interface OverlayBinPanelProps {
  filterText: string;
}

export function OverlayBinPanel({ filterText }: OverlayBinPanelProps) {
  const { overlays: allOverlays } = useProjectContent();
  const { setWorkbenchMode } = useWorkbench();
  const { setCurrentOverlayId } = useOverlayEditor();
  const { overlayLayerId, setOverlayLayer } = usePresentationLayers();

  const normalizedFilter = filterText.trim().toLowerCase();
  const overlays = allOverlays.filter((overlay) => {
    if (!normalizedFilter) return true;
    return overlay.name.toLowerCase().includes(normalizedFilter) || overlay.type.toLowerCase().includes(normalizedFilter);
  });

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3">
      {overlays.map((overlay, index) => {
        function handleAssignLayer() {
          setCurrentOverlayId(overlay.id);
          setOverlayLayer(overlay.id);
        }
        function handleEditOverlay() {
          setCurrentOverlayId(overlay.id);
          setWorkbenchMode('overlay-editor');
        }
        return (
          <ThumbnailTile
            key={overlay.id}
            onClick={handleAssignLayer}
            onDoubleClick={handleEditOverlay}
            selected={overlayLayerId === overlay.id}
            body={<div className="grid h-full place-items-center"><span className="text-text-tertiary text-[11px] font-bold tracking-wider uppercase">{overlay.type}</span></div>}
            caption={<><span className="text-text-tertiary">{index + 1}</span> {overlay.name}</>}
          />
        );
      })}
    </div>
  );
}
