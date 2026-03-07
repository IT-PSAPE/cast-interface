import type { SlideElement } from '@core/types';
import { ThumbnailTile } from '../../../components/thumbnail-tile';
import type { RenderScene } from '../../stage/rendering/scene-types';
import { SceneFrame } from '../../../components/scene-frame';
import type { SlideVisualState } from '../../../types/ui';
import { slideTextPreview } from '../../../utils/slides';
import { SceneStage } from '../../stage/rendering/scene-stage';

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

  const outlineClass = isLive
    ? 'ring-2 ring-live ring-offset-1 ring-offset-surface-0'
    : isFocused
      ? 'ring-1 ring-focus ring-offset-1 ring-offset-surface-0'
      : '';

  return (
    <ThumbnailTile
      onClick={onActivate}
      onDoubleClick={onEdit}
      className={outlineClass}
      body={(
        <SceneFrame width={scene.width} height={scene.height} className="bg-thumb-bg" stageClassName="absolute inset-0">
          {isEmpty ? (
            <div className="absolute inset-0 z-10 grid place-items-center text-[11px] uppercase tracking-wider text-text-muted">
              Empty
            </div>
          ) : null}
          <SceneStage scene={scene} className="absolute inset-0 pointer-events-none" />
        </SceneFrame>
      )}
      caption={(
        <div className="flex items-center gap-2">
          <span className="shrink-0 text-[12px] font-semibold tabular-nums text-text-secondary">{index + 1}</span>
          <span className="truncate text-[11px] text-text-muted">{slideTextPreview(elements)}</span>
        </div>
      )}
    />
  );
}
