import { overlayToLayerElements } from '@core/presentation-layers';
import type { Overlay } from '@core/types';
import { SceneFrame } from '../../../components/scene-frame';
import { ThumbnailTile } from '../../../components/thumbnail-tile';
import { buildRenderScene } from '../../stage/rendering/build-render-scene';
import { SceneStage } from '../../stage/rendering/scene-stage';

interface OverlayCardProps {
  overlay: Overlay;
  index: number;
  selected: boolean;
  onClick: () => void;
  onDoubleClick?: () => void;
}

export function OverlayCard({ overlay, index, selected, onClick, onDoubleClick }: OverlayCardProps) {
  const scene = buildRenderScene(null, overlayToLayerElements(overlay));
  const outlineClass = selected ? 'ring-1 ring-brand-400 ring-offset-1 ring-offset-background-primary' : '';

  return (
    <ThumbnailTile
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      selected={selected}
      className={outlineClass}
      body={(
        <SceneFrame width={scene.width} height={scene.height} className="bg-background-tertiary" stageClassName="absolute inset-0">
          <SceneStage scene={scene} className="absolute inset-0 pointer-events-none" />
        </SceneFrame>
      )}
      caption={(
        <div className="flex items-center gap-2">
          <span className="shrink-0 text-sm font-semibold tabular-nums text-text-secondary">{index + 1}</span>
          <span className="truncate text-sm text-text-tertiary">{overlay.name}</span>
        </div>
      )}
    />
  );
}
