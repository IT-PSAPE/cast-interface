import { useNavigation } from '../../../contexts/navigation-context';
import { usePresentationLayers } from '../../../contexts/presentation-layer-context';

export function OverlayPanel() {
  const { activeBundle } = useNavigation();
  const { overlayLayerId, setOverlayLayer } = usePresentationLayers();

  if (!activeBundle) return null;

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3">
      {activeBundle.overlays.map((overlay, index) => {
        function handleAssignLayer() { setOverlayLayer(overlay.id); }
        const selectedClass = overlayLayerId === overlay.id ? 'border-selected/50' : 'border-stroke';

        return (
          <button key={overlay.id} onClick={handleAssignLayer} className="text-left bg-transparent border-0 p-0 cursor-pointer group">
            <div className={`bg-surface-0 border rounded aspect-[4/3] overflow-hidden grid place-items-center mb-1 transition-colors ${selectedClass}`}>
              <span className="text-text-muted text-[11px] font-bold tracking-wider uppercase">{overlay.type}</span>
            </div>
            <p className="text-[12px] text-text-secondary truncate group-hover:text-text-primary transition-colors m-0">
              <span className="text-text-muted">{index + 1}</span>{' '}
              {overlay.name}
            </p>
          </button>
        );
      })}
    </div>
  );
}
