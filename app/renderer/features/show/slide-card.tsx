import type { SlideElement } from '@core/types';
import { Thumbnail } from '../../components/display/thumbnail';
import { Play } from 'lucide-react';
import type { RenderScene } from '../stage/scene-types';
import { SceneFrame } from '../../components/display/scene-frame';
import type { SlideVisualState } from '../../types/ui';
import { slideTextPreview } from '../../utils/slides';
import { SceneStage } from '../stage/scene-stage';

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
    <Thumbnail.Tile
      onClick={onActivate}
      onDoubleClick={onEdit}
      selected={isFocused}
      overlay={isLive ? (
        <span className="absolute left-0.5 top-0.5 inline-flex h-5 w-5 items-center justify-center rounded-[2px] bg-brand_solid text-white shadow-sm">
          <Play size={12} strokeWidth={1.9} />
        </span>
      ) : null}
      body={(
        <SceneFrame width={scene.width} height={scene.height} className="bg-tertiary" stageClassName="absolute inset-0" checkerboard>
          {isEmpty ? (
            <div className="absolute inset-0 z-10 grid place-items-center text-sm uppercase tracking-wider text-tertiary">
              Empty
            </div>
          ) : null}
          <SceneStage scene={scene} surface="list" className="absolute inset-0 pointer-events-none" />
        </SceneFrame>
      )}
      caption={(
        <div className="flex items-center gap-2">
          <span className="shrink-0 text-sm font-semibold tabular-nums text-secondary">{index + 1}</span>
          <span className="truncate text-sm text-tertiary">{slideTextPreview(elements)}</span>
        </div>
      )}
    />
  );
}
