import { memo, useMemo } from 'react';
import type { Id, Overlay } from '@core/types';
import { useWorkbench } from '../../../contexts/workbench-context';
import { useOverlayEditor } from '../../../contexts/asset-editor/asset-editor-context';
import { usePresentationOverlayLayer } from '../../../contexts/playback/playback-context';
import { overlayToLayerElements } from '@core/presentation-layers';
import { LazySceneStage } from '@renderer/components/display/lazy-scene-stage';
import { Thumbnail } from '../../../components/display/thumbnail';
import { SceneFrame } from '../../../components/display/scene-frame';
import { buildRenderScene } from '../../canvas/build-render-scene';
import { BinPanelLayout } from '@renderer/components/layout/collection-layout';
import { filterByText } from '../../../utils/filter-by-text';

interface OverlayBinPanelProps {
  filterText: string;
  gridItemSize: number;
}

export function OverlayBinPanel({ filterText, gridItemSize }: OverlayBinPanelProps) {
  const { actions: { setWorkbenchMode } } = useWorkbench();
  const { overlays: allOverlays, setCurrentOverlayId } = useOverlayEditor();
  const { activeOverlayIds, activateOverlay } = usePresentationOverlayLayer();

  const overlays = useMemo(
    () => filterByText(allOverlays, filterText, (overlay: Overlay) => [overlay.name, overlay.type]),
    [allOverlays, filterText],
  );

  return (
    <BinPanelLayout gridItemSize={gridItemSize}>
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

function OverlayCardImpl({ overlay, index, isActive, onActivate, onEdit, setWorkbenchMode }: OverlayCardProps) {
  const scene = useMemo(() => buildRenderScene(null, overlayToLayerElements(overlay)), [overlay]);

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
          <LazySceneStage scene={scene} surface="list" className="absolute inset-0" />
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

const OverlayCard = memo(OverlayCardImpl);
