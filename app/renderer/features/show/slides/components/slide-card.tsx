import type { SlideElement } from '@core/types';
import { ThumbnailTile } from '../../../../components/display/thumbnail-tile';
import { ThumbnailLiveBadge } from '../../../../components/display/thumbnail-live-badge';
import type { RenderScene } from '../../../stage/rendering/scene-types';
import { SceneFrame } from '../../../../components/display/scene-frame';
import type { SlideVisualState } from '../../../../types/ui';
import { slideTextPreview } from '../../../../utils/slides';
import { SceneStage } from '../../../stage/rendering/scene-stage';

interface SlideCardProps {
  index: number;
  state: SlideVisualState;
  scene: RenderScene;
  elements: SlideElement[];
  isFocused: boolean;
  onActivate: () => void;
  onEdit: () => void;
}

export function SlideCard({ index, state, scene, elements, isFocused, onActivate, onEdit }: SlideCardProps) {
  const isLive = state === 'live';
  const isEmpty = state === 'warning';

  return (
    <ThumbnailTile
      onClick={onActivate}
      onDoubleClick={onEdit}
      selected={isFocused}
      overlay={isLive ? <ThumbnailLiveBadge className="absolute left-2 top-2" /> : null}
      body={(
        <SceneFrame width={scene.width} height={scene.height} className="bg-background-tertiary" stageClassName="absolute inset-0" checkerboard>
          {isEmpty ? (
            <div className="absolute inset-0 z-10 grid place-items-center text-sm uppercase tracking-wider text-text-tertiary">
              Empty
            </div>
          ) : null}
          <SceneStage scene={scene} surface="list" className="absolute inset-0 pointer-events-none" />
        </SceneFrame>
      )}
      caption={(
        <div className="flex items-center gap-2">
          <span className="shrink-0 text-sm font-semibold tabular-nums text-text-secondary">{index + 1}</span>
          <span className="truncate text-sm text-text-tertiary">{slideTextPreview(elements)}</span>
        </div>
      )}
    />
  );
}
