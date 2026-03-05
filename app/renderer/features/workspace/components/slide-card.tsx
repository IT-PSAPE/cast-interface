import type { SlideElement } from '@core/types';
import type { RenderScene } from '../rendering/scene-types';
import { SceneFrame } from '../../../components/scene-frame';
import type { SlideVisualState } from '../../../types/ui';
import { slideTextPreview } from '../../../utils/slides';
import { SceneStage } from '../rendering/scene-stage';

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
    <button
      role="gridcell"
      onClick={onActivate}
      onDoubleClick={onEdit}
      className={`rounded-md overflow-hidden bg-thumb-bg text-text-primary text-left cursor-pointer transition-shadow ${outlineClass}`}
    >
      <SceneFrame width={scene.width} height={scene.height} className="bg-thumb-bg" stageClassName="absolute inset-0">
        {isEmpty && (
          <div className="absolute inset-0 grid place-items-center text-text-muted text-[11px] uppercase tracking-wider z-10">
            Empty
          </div>
        )}
        <SceneStage scene={scene} className="absolute inset-0 pointer-events-none" />
      </SceneFrame>

      <div className="flex items-center gap-2 px-2 py-1.5 bg-surface-2 w-full">
        <span className="text-[12px] font-semibold text-text-secondary tabular-nums shrink-0">
          {index + 1}
        </span>
        <span className="text-[11px] text-text-muted truncate">{slideTextPreview(elements)}</span>
      </div>
    </button>
  );
}
