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
    ? 'ring-2 ring-green-500 ring-offset-1 ring-offset-background-primary'
    : isFocused
      ? 'ring-1 ring-brand-400 ring-offset-1 ring-offset-background-primary'
      : '';

  return (
    <ThumbnailTile
      onClick={onActivate}
      onDoubleClick={onEdit}
      className={outlineClass}
      body={(
        <SceneFrame width={scene.width} height={scene.height} className="bg-background-tertiary" stageClassName="absolute inset-0">
          {isEmpty ? (
            <div className="absolute inset-0 z-10 grid place-items-center text-sm uppercase tracking-wider text-text-tertiary">
              Empty
            </div>
          ) : null}
          <SceneStage scene={scene} className="absolute inset-0 pointer-events-none" />
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
